<script setup lang="ts">
import { shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, SceneQuality, graphicsFrame, resetGraphics } from './BriqmasGraphics';
import { updateScene } from './BriqmasCompleted';
import { APP_ENV } from '@/Meta';

import { useGenesisStore } from '@/builder/GenesisStore';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { useRouter } from 'vue-router';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';

//////////////////////////////
//////////////////////////////

const genesisStore = useGenesisStore();
const canvas = ref(null as unknown as HTMLCanvasElement);

let setSceneReady: CallableFunction;
const sceneReady = new Promise((resolve) => {
    setSceneReady = resolve;
})

const router = useRouter();

const tokenName = 'briqmas/briqmas_tree';

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

        // At this point this should be loaded because we've loaded the wallet.
        //if (userBoxesStore.current?.availableBoxes.indexOf(tokenName) === -1)
        //return fsm.switchTo('NO_BOX');

        // use a timeout -> We use this to cheat and hopefully load the box textures.
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

    await setupScene();

    await updateScene(setupData.scene);

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
                <p class="mt-12">Unfortunately, you don't own a briqmas box.</p>
                <p>Try getting one on the secondary market!</p>
                <div class="flex gap-4 mt-8 ">
                    <a href="https://aspect.co/collection/0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139" rel="noopener" target="_blank">
                        <Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><img class="w-6 mr-3" :src="AspectLogo"> Aspect</Btn>
                    </a>
                    <a href="https://mintsquare.io/collection/starknet/0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139" rel="noopener" target="_blank">
                        <Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><MintsquareLogo class="mr-3" height="1.5rem" width="1.5rem"/> Mintsquare</Btn>
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
