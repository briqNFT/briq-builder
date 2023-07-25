<script setup lang="ts">
import { shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, SceneQuality, graphicsFrame, resetGraphics, setupOrbitalControls } from './BriqmasGraphics';
import { updateScene } from './BriqmasCompleted';
import { APP_ENV } from '@/Meta';

import { useGenesisStore } from '@/builder/GenesisStore';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { useRoute, useRouter } from 'vue-router';

import UnframedLogo from '@/assets/logo-unframed-square.svg';
import { userSetStore } from '@/builder/UserSets';

//////////////////////////////
//////////////////////////////

const genesisStore = useGenesisStore();
const canvas = ref(null as unknown as HTMLCanvasElement);

let setSceneReady: CallableFunction;
const sceneReady = new Promise((resolve) => {
    setSceneReady = resolve;
})

const router = useRouter();
const route = useRoute();

const tokenName = 'briqmas/briqmas_tree';

let scene: unknown;

//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'NO_BOX' | 'SAPIN';

interface FsmState {
    onEnter(): Promise<any>;
    onLeave?: (to: string) => Promise<void>;
    frame?: (delta: number) => void;
    onClick?: (event: MouseEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
}

const initialState = new class implements FsmState {
    async onEnter() {
        return;
    }
}

const loadingState = new class implements FsmState {
    fps = [] as number[];
    hasEnoughFrames: Promise<void>;
    setEnoughFrames: CallableFunction | undefined;

    constructor() {
        this.hasEnoughFrames = new Promise((resolve, _) => {
            this.setEnoughFrames = resolve;
        })
    }

    async onEnter() {
        await sceneReady;
        let userSet = route.query['token'] ?
            userSetStore.current?.sets.find(x => x === route.query['token'])
            : userSetStore.current?.sets.find(x => userSetStore.current?.setData[x]?.booklet_id === 'briqmas/briqmas_tree');
        if (!userSet) {
            // We have a data race here, because the sets are fetching data independently after the wallet has loaded.
            // So if we haven't found a set, try again in a second, then fail.
            // This should generally be OK, because we can sorta assume that the frontend has cached the data.
            // TODO: improve on this.
            await new Promise(res => setTimeout(() => res(null), 1500));
            userSet = userSetStore.current?.sets.find(x => userSetStore.current?.setData[x]?.booklet_id === 'briqmas/briqmas_tree');
            if (!userSet)
                return fsm.switchTo('NO_BOX');
        }

        await updateScene(scene, userSet);

        // TODO: timeout is probably un-needed here.
        return setTimeout(() => fsm.switchTo('SAPIN'), 100);
    }

    frame(delta: number) {

        /*
        this.fps.unshift(delta * 1000);
        if (this.fps.length > 120)
            this.fps.pop();
        if (this.fps.length > 12 && this.setEnoughFrames) {
            this.setEnoughFrames();
            this.setEnoughFrames = undefined;
        }
        */
    }
}

const noBoxState = new class implements FsmState {
    async onEnter() {}
}

const sapinState = new class implements FsmState {
    async onEnter() {}
    frame(delta: number) {
    }
}

const fsm = shallowReactive(new class FSM {
    stateName = 'CHECK_WALLET' as steps;
    state = initialState as FsmState;
    async switchTo(state: steps) {
        if (this.state.onLeave)
            await this.state.onLeave(state);
        this.state = {
            'CHECK_WALLET': initialState,
            'LOADING': loadingState,
            'NO_BOX': noBoxState,
            'SAPIN': sapinState,
        }[state];
        this.stateName = state;
        await this.state.onEnter();
    }
});

const step = computed(() => fsm.stateName);

//////////////////////////////
//////////////////////////////

let lastTime: number;
let mounted = false;

let initFsm: Promise<void>;
let walletWatcher: WatchStopHandle;

onBeforeMount(() => {
    initFsm = fsm.state.onEnter();

    walletWatcher = watch([toRef(walletStore, 'userWalletAddress')], () => {
        if (walletStore.userWalletAddress)
            fsm.switchTo('LOADING');
        else
            fsm.switchTo('CHECK_WALLET');
    }, {
        immediate: true,
    })
});

onMounted(async () => {
    mounted = true;
    await initFsm;
    const setupData = await useRenderer(canvas.value);
    scene = setupData.scene;

    await setupScene();

    setupOrbitalControls();

    setSceneReady();

    const frame = (time: number) => {
        if (!mounted)
            return;
        if (!lastTime)
            lastTime = time - 16;
        const delta = time - lastTime;
        lastTime = time;

        graphicsFrame(delta / 1000.0);
        if (fsm.state.frame)
            fsm.state.frame(delta / 1000.0);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    if (APP_ENV !== 'prod') {
        /** FPS counter */
        const Stats = (await import('stats.js')).default;
        var stats = new Stats();
        stats.showPanel(0)
        document.body.appendChild(stats.dom);
        const animate = () => {
            if (!mounted)
                return;
            stats.end();
            stats.begin();
            requestAnimationFrame(animate);
        }

        stats.begin();
        requestAnimationFrame(animate);
    }
});

onUnmounted(() => {
    resetGraphics();
    walletWatcher();
    mounted = false;
})


import FireplaceAudio from './FireplaceAudio.vue';
import { getSetMarketplaceUrl } from '@/chain/Marketplaces';
const quality = ref(SceneQuality.ULTRA);

</script>

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        ref="canvas"
        @click="(event) => fsm.state?.onClick?.(event)"
        @pointermove="(event) => fsm.state?.onPointerMove?.(event)"/>
    <!-- preload -->
    <div class="hidden absolute"><img :src="genesisStore.coverBookletRoute(tokenName)"></div>
    <Transition name="fade">
        <div
            v-if="step === 'CHECK_WALLET' || step === 'LOADING' || step === 'NO_BOX'"
            class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-grad-lightest bg-repeat bg-auto alternate-buttons flex-col gap-4 bg-opacity-100 transition-all"
            :style="{ backgroundImage: `url(${BriqsOverlay})`, backgroundSize: '1000px auto' }">
            <h2>briqmas is here</h2>
            <template v-if="step === 'NO_BOX'">
                <p class="mt-12">You need a minted briqmas tree set to access this page.</p>
                <p>You can build one using an official briqmas tree booklet!</p>
                <div class="flex gap-4 mt-8 ">
                    <a :href="getSetMarketplaceUrl()" rel="noopener" target="_blank">
                        <Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><UnframedLogo class="mr-3" height="1.5rem" width="1.5rem"/> Unframed</Btn>
                    </a>
                </div>
            </template>
            <template v-else>
                <p v-if="step === 'LOADING'">...Loading Scene...</p>
                <template v-else>
                    <Btn @click="walletStore.openWalletSelector()">Connect your Wallet</Btn>
                </template>
            </template>
        </div>
    </Transition>
    <template v-if="step !== 'CHECK_WALLET' && step !== 'LOADING' && APP_ENV === 'dev'">
        <div class="absolute bottom-0 left-0 text-base">
            <FireplaceAudio/>
        </div>
        <div class="absolute bottom-[3rem] left-0 text-base">
            <select v-model="quality" @change="setupScene(quality)">
                <option :value="SceneQuality.LOW">Low</option>
                <option :value="SceneQuality.MEDIUM">Medium</option>
                <option :value="SceneQuality.HIGH">High</option>
                <option :value="SceneQuality.ULTRA">Ultra</option>
            </select>
        </div>
    </template>
    <div v-if="step === 'SAPIN'" class="fixed right-0 top-0 m-8 shadow bg-grad-lightest rounded-md p-6 max-w-[23rem] text-md leading-snug">
        <p class="mb-2">The sounds of the fireplace. Outside, the stars twinkle.</p>
        <p class="mb-2">Yesterday was briqmas</p>
        <p class="mb-2">Your tree stands in the living room.</p>
        <div class="mt-8 flex justify-end">
            <RouterLink to="/profile?tab=GENESIS"><Btn secondary class="pointer-events-auto font-normal !text-sm">Back to inventory</Btn></RouterLink>
        </div>
    </div>
</template>


<style>
#unboxing hr {
    @apply my-8 text-black;
}

#unboxing ul {
    @apply list-['-'] list-outside;
}
#unboxing li {
    @apply pl-3 ml-3;
}
#unboxing blockquote {
    @apply bg-opacity-20 bg-black rounded px-4 py-2 italic;
}
</style>

<style scoped>

.fade-enter-to, .fade-leave-from {
    opacity: 100%;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0%;
}
.fade-enter-active, .fade-leave-active {
    transition: all 2.5s ease !important;
}
</style>
