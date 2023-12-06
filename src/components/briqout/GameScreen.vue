
<script setup lang="ts">
import { Game, replay } from 'briqout';
import { reactive, onMounted, onUnmounted, ref, computed, onBeforeUnmount } from 'vue';
import { SceneQuality, setupScene, updateScene, render } from './BriqoutGraphics';
import { briqoutStore } from './GameData';
import { useBriqoutAudio } from './Sound';
import { WEB_WALLET_URL, maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';

import Header from '@/components/landing_page/Header.vue';

import { hash, ec, Signer, Account, Provider } from 'starknet';
import { chainBriqs } from '@/builder/ChainBriqs';
import { userSetStore } from '@/builder/UserSets';
import { backendManager } from '@/Backend';
import GenericCard from '../builder/genesis/GenericCard.vue';
import type { Briq } from '@/builder/Briq';
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

const checkReplay = async () => {
    const res = await fetch('http://localhost:3000/verify_replay', {
        method: 'POST',
        body: JSON.stringify({
            trace: game.exportTrace(),
            chain_id: getCurrentNetwork(),
        }),
    })
    const signedMessage = await res.json();
    console.log('signedMessage', signedMessage);

    const msgHash = hash.computeHashOnElements(signedMessage.message);
    // TODO change starknet.js v5
    const privateKey = '0x1234567890987654321';
    const keyPair = ec.getKeyPair(privateKey);
    const result = ec.verify(keyPair, msgHash, signedMessage.signature);
    console.log('Result (boolean) =', result);

    const sg = new Signer(keyPair);
    const acc = new Account(new Provider({ rpc: { nodeUrl: 'http://localhost:5050' } }), '0x598f57e84be4279ff74e7ba389be4d46ec2b1c7974088caad07ebd5a3e8baaa', sg);

    let tx = await acc.execute({
        contractAddress: '0x598f57e84be4279ff74e7ba389be4d46ec2b1c7974088caad07ebd5a3e8baaa',
        entrypoint: 'execute',
        calldata: ['0x0'],
    });
    console.log(tx);
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

const setsToMigrate = computed(() => {
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

const page = ref('home' as 'home' | 'migrate' | 'ingame');
const pageStatus = computed(() => {
    if (page.value === 'ingame')
        return 'ingame';
    return 'pregame';
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
                <div class="flex flex-col justify-center items-center min-h-[50vh] gap-4">
                    <h1 class="mb-12">briqout</h1>
                    <Btn class="w-[14rem] h-12" @click="page = 'migrate'">Migrate your assets</Btn>
                    <Btn class="w-[14rem] h-12" secondary @click="reset()">Quick play</Btn>
                    <Btn class="w-[14rem] h-12" secondary>How to play</Btn>
                </div>
            </template>
            <template v-else-if="page === 'migrate'">
                <template v-if="maybeStore?.userWalletAddress">
                    <div class="container m-auto relative">
                        <Btn no-background icon class="absolute top-0 left-12" @click="page='home'"><i class="fas fa-arrow-left"/> Back</Btn>
                        <h2 class="text-center mt-12">Asset migration</h2>
                        <p class="text-center my-6"><Btn secondary @click="reset()">Migrate only my briqs</Btn></p>
                        <p class="text-center my-6 font-medium">Or choose an NFT to migrate</p>
                        <div class="flex justify-center gap-4 flex-wrap">
                            <GenericCard
                                v-for="briqset of setsToMigrate" :key="briqset.id"
                                :title="briqset.name"
                                status="LOADED"
                                :image-src="backendManager.getPreviewUrl(briqset.id)"
                                @click="reset(briqset.id, briqset.briqs)"
                                class="max-w-[20rem]">
                                <p>{{ briqset.nb_briqs }}</p>
                            </GenericCard>
                        </div>
                    </div>
                </template>
                <Btn @click="connectWallet()" v-else>Connect wallet</Btn>
            </template>
        </div>
        <div v-else-if="pageStatus === 'ingame' && game.status === 'running'">
            <p class="text-lg text-white relative top-[50px]">Lives: {{ (game.paddleWidth / 25 - 2) }}</p>
            <p class="text-lg text-white relative top-[50px]">Time Left: {{ Math.ceil(5 * 60 - game.time) }}</p>
        </div>
        <template v-else-if="pageStatus === 'ingame' && game.status === 'lost'">
            <div class="absolute w-full h-full flex flex-col gap-4 justify-center items-center">
                <h1 class="text-xl md:text-[6rem] text-white mb-8">Figration Mailed</h1>
                <Btn secondary class="w-[10rem]" @click="reset()">Try again</Btn>
                <Btn secondary class="w-[10rem]" @click="page = 'home'">Main Menu</Btn>
            </div>
        </template>
        <template v-else-if="pageStatus === 'ingame' && game.status === 'won'">
            <div class="absolute w-full h-full flex flex-col gap-4 justify-center items-center">
                <h1 class="text-xl md:text-[6rem] text-text mb-8">You won !</h1>
                <Btn class="w-[10rem]">Migrate asset</Btn>
                <Btn secondary class="w-[10rem]" @click="page = 'home'">Main Menu</Btn>
            </div>
        </template>
    </Transition>
</template>
