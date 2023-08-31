
<script setup lang="ts">
import { Game, replay } from 'briqout';
import { reactive, onMounted, onUnmounted, ref, computed } from 'vue';
import { SceneQuality, setupScene, updateScene, render } from './BriqoutGraphics';
import { useBriqoutAudio } from './Sound';
import { WEB_WALLET_URL, maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';

import { hash, ec } from 'starknet';
import { chainBriqs } from '@/builder/ChainBriqs';
import { userSetStore } from '@/builder/UserSets';
import { backendManager } from '@/Backend';
import GenericCard from '../builder/genesis/GenericCard.vue';

const game = reactive(new Game());

let lastTime = undefined;

let audioSystem = undefined as Awaited<ReturnType<typeof useBriqoutAudio>> | undefined;
useBriqoutAudio().then((audio) => {
    audioSystem = audio;
});

const gameLoop = () => {
    const t = performance.now();
    const delta = (t - lastTime) / 1000.0;

    const { ticks, events } = game.update(delta);
    if (ticks) {
        lastTime = t;
        for (const event of events)
            if (event.type === 'paddlebounce')
                audioSystem?.clap();
            else if (event.type === 'briqTonk')
                audioSystem?.briqTonk();
            else if (event.type === 'wallTonk')
                audioSystem?.wallTonk();
            else if (event.type === 'powerup')
                audioSystem?.powerup();
    }
    // Save energy, cpu and gpu
    if (game.status === 'running') {
        updateScene(game, delta);
        render(delta);
    }
    requestAnimationFrame(gameLoop);
};

const reset = () => {
    lastTime = performance.now();
    setupScene(game, SceneQuality.MEDIUM);
    game.start({
        migrator: maybeStore.value!.userWalletAddress!,
        currentBriqs: chainBriqs.value?.getNbBriqs() ?? 0,
        briqsToMigrate: 50,
        setToMigrate: '0',
    });
}

const checkReplay = async () => {
    replay(game.exportTrace());
    const res = await fetch('http://localhost:3000/verify_replay', {
        method: 'POST',
        body: JSON.stringify({
            trace: game.exportTrace(),
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
}

const onMouseMove = (ev) => {
    game.pushEvent({
        type: 'mousemove',
        x: ev.clientX / window.innerWidth,
    });
}

onMounted(async () => {
    window.addEventListener('mousemove', onMouseMove);

    if (!lastTime)
        lastTime = performance.now();

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

onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
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
            pending: userSetStore.current?.metadata[setId]?.status === 'TENTATIVE',
        }
    }).filter(x => !!x) || [];
})

</script>

<template>
    <template v-if="game.status === 'pregame'">
        <div class="w-full h-full bg-white flex flex-col justify-center items-center absolute top-0 left-0">
            <h1 class="mb-12">briqout</h1>
            <template v-if="maybeStore?.userWalletAddress">
                <h3>Choose an NFT to migrate, or play to migrate your briqs</h3>
                <div>
                    <GenericCard
                        v-for="briqset of setsToMigrate" :key="briqset.id"
                        :title="briqset.name"
                        status="LOADED"
                        :image-src="backendManager.getPreviewUrl(briqset.id)"
                        @click="reset()">
                        <p>{{ briqset.nb_briqs }}</p>
                    </GenericCard>
                </div>
                <Btn secondary @click="reset()">Migrate only my briqs</Btn>
            </template>
            <Btn @click="connectWallet()" v-else>Connect wallet</Btn>
        </div>
    </template>
    <template v-else>
        <div class="m-auto">
            <div
                class="w-full h-full bg-info-error flex justify-center items-center absolute top-0 left-0"
                v-if="game.status === 'lost'">
                <button @click="reset()">LOSER</button>
                <button @click="checkReplay">check trace</button>
            </div>
            <div
                class="w-full h-full bg-info-success bg-opacity-50 flex justify-center items-center absolute top-0 left-0"
                v-if="game.status === 'won'">
                <button @click="reset()">replay</button>
                <button @click="checkReplay">check trace</button>
            </div>
        </div>

        <div>
            Debug trace:
            <p v-for="trace in game.gameTrace">{{ trace }}</p>
        </div>
    </template>
</template>
