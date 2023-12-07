
<script setup lang="ts">
import { Game } from 'briqout';
import { reactive, onMounted, onUnmounted, ref, computed, onBeforeUnmount } from 'vue';
import { SceneQuality, setupScene, updateScene, render } from './BriqoutGraphics';
import { briqoutStore } from './GameData';
import { useBriqoutAudio } from './Sound';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';

import Header from '@/components/landing_page/Header.vue';

import BriqoutLogo from '@/assets/briqout/briqout-logo.png';

import { chainBriqs } from '@/builder/ChainBriqs';
import { userSetStore } from '@/builder/UserSets';
import { backendManager } from '@/Backend';
import GenericCard from '../builder/genesis/GenericCard.vue';
import type { Briq } from '@/builder/Briq';
import { useRoute } from 'vue-router';
import { externalSetCache } from '@/builder/ExternalSets';
import { getCurrentNetwork } from '@/chain/Network';

const game = reactive(new Game());

let lastTime = undefined;
let lastGameTime = undefined;

let audioSystem = undefined as Awaited<ReturnType<typeof useBriqoutAudio>> | undefined;
useBriqoutAudio().then((audio) => {
    audioSystem = audio;
});

let keepOnLooping = true;

let mouseMode = 'absolute' as 'lock' | 'absolute';

const gameLoop = () => {
    const t = performance.now();
    const delta = (t - lastTime) / 1000.0;
    const gameDelta = (t - lastGameTime) / 1000.0;
    lastTime = t;

    const { ticks, events } = game.update(gameDelta);
    if (ticks) {
        lastGameTime = t;
        for (const event of events) {
            if (event.type === 'won' || event.type === 'lost')
                if (document.exitPointerLock)
                    document.exitPointerLock();
            if (event.type === 'paddlebounce')
                audioSystem?.clap();
            else if (event.type === 'briqTonk')
                audioSystem?.briqTonk();
            else if (event.type === 'wallTonk')
                audioSystem?.wallTonk();
            else if (event.type === 'powerup')
                audioSystem?.powerup();
            else if (event.type === 'ballLost')
                audioSystem?.ballLost();
        }
    }
    // Save energy, cpu and gpu
    if (pageStatus.value === 'ingame') {
        updateScene(game, delta, events);
        render(delta);
    }
    if (keepOnLooping)
        requestAnimationFrame(gameLoop);
};

const reset = (set?: string, briqs?: Briq[]) => {
    page.value = 'ingame';

    lastTime = performance.now();
    lastGameTime = performance.now();
    setupScene(game, SceneQuality.MEDIUM);

    // Doesn't exist on mobile
    if (briqoutStore.canvas.requestPointerLock) {
        mouseMode = 'lock';
        briqoutStore.canvas.requestPointerLock();
    }

    game.start({
        migrator: maybeStore.value!.userWalletAddress!,
        currentBriqs: chainBriqs.value?.getNbBriqs() ?? 0,
        briqsToMigrate: 50,
        setToMigrate: set || '0x0',
    }, briqs);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

const onMouseMove = (ev) => {
    game.pushEvent({
        type: 'mousemove',
        deltaX: ev.movementX,
        x: ev.clientX / window.innerWidth,
    });
}

const onMouseUp = (ev) => {
    game.pushEvent({
        type: 'mouseup',
    });
}

onMounted(async () => {
    if (!lastTime) {
        lastTime = performance.now();
        lastGameTime = performance.now();
    }

    requestAnimationFrame(gameLoop);

    if (APP_ENV !== 'prod') {
        /** FPS counter */
        const Stats = (await import('stats.js')).default;
        var stats = new Stats();
        stats.showPanel(0)
        document.body.appendChild(stats.dom);
        const animate = () => {
            stats.end();
            stats.begin();
            requestAnimationFrame(animate);
        }

        stats.begin();
        requestAnimationFrame(animate);
    }
});

onBeforeUnmount(() => {
    keepOnLooping = false;
}),

onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
});


let _clicked = false;
const walletStore = maybeStore;
const connectWallet = () => {
    if (walletStore.value)
        walletStore.value.openWalletSelector()
    else if (!_clicked) {
        _clicked = true;
        walletInitComplete.then(() => walletStore.value!.openWalletSelector());
    }
}

const setsToPlayOn = computed(() => {
    return userSetStore.current?.sets.map(setId => {
        const data = userSetStore.current?.setData[setId];
        return {
            id: setId,
            name: data?.data?.name || setId,
            nb_briqs: data?.data?.getNbBriqs?.() || 0,
            created_at: data?.created_at || Date.now(),
            briqs: data?.data?.getAllBriqs() || undefined,
        }
    }).filter(x => !!x) || [];
})


const route = useRoute();

const page = ref('home' as 'home' | 'ingame');
const pageStatus = computed(() => {
    if (page.value === 'ingame')
        return 'ingame';
    if (route.query.network)
        return 'invite';
    return 'pregame';
})

const inviteSet = computed(() => {
    if (pageStatus.value !== 'invite')
        return undefined;
    return externalSetCache[route.query.network as string][route.query.set_id as string]._data?.data;
})

const tweetText = computed(() => {
    if (pageStatus.value !== 'ingame' || game.status !== 'won')
        return '';
    return `I broke my @briqNFT set in only ${Math.ceil(game.time)} playing briqout!\nThink you can do better?\n`;
})

const shareUrl = computed(() => {
    if (pageStatus.value !== 'ingame' || game.status !== 'won')
        return '';
    return `https://${window.location.hostname}${route.path}?network=${route.query.network || getCurrentNetwork()}&set_id=${route.query.set_id || game.getParams()?.setToMigrate}`;
})
</script>

<style scoped>
.fade-enter-to, .fade-leave-from {
    opacity: 100%;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0%;
}
.fade-enter-active, .fade-leave-active {
  transition: all 0.5s ease-in-out !important;
}
</style>

<template>
    <Transition name="fade" mode="out-in">
        <div v-if="pageStatus === 'pregame'" class="bg-background min-h-screen min-w-screen">
            <Header/>
            <template v-if="page === 'home'">
                <div class="flex flex-col justify-center items-center my-[3rem] tall-md:my-[6rem] tall-lg:my-[8rem] min-h-[50vh] gap-4">
                    <h1 class="mb-12 !font-logo text-primary text-[4rem]">
                        <img :src="BriqoutLogo" alt="briqout logo" class="h-[8rem]">
                    </h1>
                    <template v-if="maybeStore?.userWalletAddress">
                        <div class="container m-auto relative">
                            <p class="text-center my-6 font-medium">Choose the map to play on</p>
                            <div class="flex justify-center gap-4 flex-wrap">
                                <GenericCard
                                    v-for="briqset of setsToPlayOn" :key="briqset.id"
                                    :title="briqset.name"
                                    status="LOADED"
                                    :image-src="backendManager.getPreviewUrl(briqset.id)"
                                    @click="reset(briqset.id, briqset.briqs)"
                                    class="max-w-[20rem] cursor-pointer">
                                    <p>{{ briqset.nb_briqs }}</p>
                                </GenericCard>
                                <p v-if="!setsToPlayOn.length" class="flex justify-center items-center gap-2 flex-col bg-grad-lightest p-6 rounded border border-grad-light">
                                    <span>You have no briq NFTs built to play with !</span>
                                    <routerLink to="/builder"><Btn class="text-md">Create one</Btn></routerLink>
                                </p>
                            </div>
                        </div>
                    </template>
                    <Btn @click="connectWallet()" v-else>Connect wallet to play with your own NFTs</Btn>
                    <Btn class="w-[14rem] h-12" secondary @click="reset()">Quick play</Btn>
                </div>
            </template>
        </div>
        <div v-else-if="pageStatus === 'invite'">
            <Header/>
            <div class="flex flex-col justify-center items-center my-[3rem] tall-md:my-[6rem] tall-lg:my-[8rem] min-h-[50vh] gap-4">
                <h1 class="mb-12 !font-logo text-primary text-[4rem]">
                    <img :src="BriqoutLogo" alt="briqout logo" class="h-[8rem]">
                </h1>
                <div class="container m-auto relative">
                    <p class="text-center my-6 font-medium">You've been invited to play a specific briq set !</p>
                    <div class="flex justify-center gap-4 flex-wrap">
                        <GenericCard
                            v-if="inviteSet"
                            :title="inviteSet.name"
                            status="LOADED"
                            :image-src="backendManager.getPreviewUrl(inviteSet.id)"
                            @click="reset(inviteSet.id, inviteSet.getAllBriqs())"
                            class="max-w-[20rem] min-w-[16rem] cursor-pointer">
                            <p>{{ inviteSet.getNbBriqs() }}</p>
                        </GenericCard>
                    </div>
                </div>
                <a href="/briqout"><Btn secondary class="w-[14rem]">Back to Main Menu</Btn></a>
            </div>
        </div>
        <div v-else-if="pageStatus === 'ingame' && game.status === 'running'" class="px-4 py-2">
            <p class="text-lg text-white font-semibold relative top-[50px]">Lives: {{ (game.paddleWidth / 25 - 2) }}</p>
            <p class="text-lg text-white font-semibold relative top-[50px]">Time Left: {{ Math.ceil(5 * 60 - game.time) }}</p>
        </div>
        <template v-else-if="pageStatus === 'ingame' && game.status === 'lost'">
            <div class="absolute w-full h-full flex flex-col gap-4 justify-center items-center">
                <h1 class="text-xl md:text-[6rem] text-white mb-8">Fission Mailed</h1>
                <!-- buggy for now <Btn secondary class="w-[10rem]" @click="reset()">Try again</Btn>-->
                <Btn secondary class="w-[14rem]" @click="page = 'home'">Back to Main Menu</Btn>
            </div>
        </template>
        <template v-else-if="pageStatus === 'ingame' && game.status === 'won'">
            <div class="absolute w-full h-full flex flex-col gap-2 justify-center items-center">
                <h1 class="text-xl md:text-[6rem] text-text mb-8">You won in {{ Math.ceil(game.time) }}s !</h1>
                <template v-if="(game.getParams()?.setToMigrate || '0x0') !== '0x0'">
                    <h3 class="mt-4">Challenge others to do better</h3>
                    <a
                        target="_blank"
                        :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`">
                        <Btn v-bind="$attrs" icon class="text-sm justify-start font-normal"><i class="fa-brands fa-twitter text-md mr-2"/> Share on Twitter</Btn>
                    </a>
                    <template v-if="userSetStore.current?.setData?.[game.getParams()!.setToMigrate]">
                        <h4 class="mt-8 !mb-0">Roleplay</h4>
                        <Btn secondary @click="userSetStore.current!.disassemble([game.getParams()!.setToMigrate]);">Disassemble the set</Btn>
                    </template>
                </template>
                <Btn secondary class="w-[14rem] mt-16" @click="page = 'home'">Back to Main Menu</Btn>
            </div>
        </template>
    </Transition>
</template>
