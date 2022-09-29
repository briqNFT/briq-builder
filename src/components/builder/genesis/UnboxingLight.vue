<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { reactive, shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { useBuilder } from '@/components/builder/BuilderComposable';
import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, graphicsFrame, resetGraphics, SceneQuality, setBox } from './UnboxingGraphicsLight';
import { APP_ENV } from '@/Meta';

import { userBoxesStore } from '@/builder/UserBoxes';
import { useGenesisStore } from '@/builder/GenesisStore';
import contractStore from '@/chain/Contracts';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { hexUuid } from '@/Uuid';
import { Quaternion } from 'three';


//////////////////////////////
//////////////////////////////

const genesisStore = useGenesisStore();
const canvas = ref(null as unknown as HTMLCanvasElement);

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;

let setSceneReady: CallableFunction;
const sceneReady = new Promise((resolve) => {
    setSceneReady = resolve;
})

const quality = ref(SceneQuality.HIGH);


let sceneBox: THREE.Object3D;

//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'SAPIN' | 'UNBOXING' | 'UNBOXING_OPEN' | 'UNBOXED';

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
        const userData = userBoxesStore.current?.fetchData();
        await sceneReady;
        await userData;

        const boxData = {
            uid: hexUuid(),
            box_token_id: '0x12345',
            box_name: 'starknet_city/spaceman',
            position: [0, 0, 0],
            texture: genesisStore.boxTexture('starknet_city/spaceman'),
        };
        sceneBox = setBox(boxData);

        /*
        const loader = new THREE.TextureLoader();
        boxesData.forEach(data => {
            loader.loadAsync(genesisStore.boxTexture(data.box_name)).then(x => {
                if (!boxTexture[data.box_name])
                    boxTexture[data.box_name] = {
                        texture: x,
                        users: [],
                    }
                boxTexture[data.box_name].texture = x;
                boxTexture[data.box_name].texture.encoding = THREE.sRGBEncoding;
                boxTexture[data.box_name].texture.flipY = false;
                boxTexture[data.box_name].users.forEach(box => {
                    box.children[1].children[0].material.map = x;
                })
            });
        });
        */

        await this.hasEnoughFrames;

        // use a timeout -> We use this to cheat and hopefully load the box textures.
        return setTimeout(() => fsm.switchTo('SAPIN'), 100);
    }

    frame(delta: number) {
        this.fps.unshift(delta * 1000);
        if (this.fps.length > 120)
            this.fps.pop();
        if (this.fps.length > 12 && this.setEnoughFrames) {
            this.setEnoughFrames();
            this.setEnoughFrames = undefined;
        }
    }
}

const sapinState = new class implements FsmState {
    async onEnter() {}
    frame(delta: number) {
        sceneBox.rotateY(Math.PI/8*delta);
    }
}

const unboxingState = new class implements FsmState {
    rt: any;
    step = 0;
    async onEnter() {
        this.rt = sceneBox.quaternion;
    }

    frame(delta: number) {
        const tg = new Quaternion(0, 1, 0, -0.12);
        const qt = sceneBox.quaternion.slerpQuaternions(this.rt, tg, this.step);
        sceneBox.quaternion.set(qt.x, qt.y, qt.z, qt.w);
        this.step += delta * 0.1;
        if (sceneBox.quaternion.angleTo(tg) === 0)
            fsm.switchTo('UNBOXING_OPEN')
    }
}

const unboxingOpenState = new class implements FsmState {
    briqStep = 0;
    async onEnter() {}
    frame(delta: number) {
        if (sceneBox.userData.mixer.time < 4)
            sceneBox.userData.mixer.update(delta);
        else if (this.briqStep < 2) {
            this.briqStep += delta;
            sceneBox.children[sceneBox.children.length - 1].translateZ(delta * -0.3);
        } else
            fsm.switchTo('UNBOXED');

    }
}

const unboxedState = new class implements FsmState {
    async onEnter() {}
    frame(delta: number) {}
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
            'SAPIN': sapinState,
            'UNBOXING': unboxingState,
            'UNBOXING_OPEN': unboxingOpenState,
            'UNBOXED': unboxedState,
        }[state];
        this.stateName = state;
        await this.state.onEnter();
    }
});

const step = computed(() => fsm.stateName);

//////////////////////////////
//////////////////////////////


import Stats from 'stats.js';

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
    camera = setupData.camera;
    scene = setupData.scene;

    await setupScene();

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
        setupData.render();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /** FPS counter */
    var stats = new Stats();
    stats.showPanel(0)
    document.body.appendChild(stats.dom);
    function animate() {
        if (!mounted)
            return;
        stats.end();
        stats.begin();
        requestAnimationFrame(animate);
    }

    stats.begin();
    requestAnimationFrame(animate);
});

onUnmounted(() => {
    resetGraphics();
    walletWatcher();
    mounted = false;
})



import { useRouter } from 'vue-router';
const router = useRouter()

const goToBuilder = () => {
    router.push({ name: 'Builder' });
}

const start_unbox = () => {
    fsm.switchTo('UNBOXING');
}

const unbox = async () => {
    await contractStore.box?.unbox(walletStore.userWalletAddress, selectedObject.value?.userData.box_token_id);

    if (true) {
        // Create a new local set with the proper booklet.
        const { setsManager, store } = useBuilder();
        const maybeExisting = setsManager.setList.filter(sid => {
            setsManager.getInfo(sid).local?.getNbBriqs() === 0 && setsManager.getInfo(sid).booklet === 'spaceman'
        });
        if (maybeExisting.length !== 0) {
            store.dispatch('builderData/select_set', maybeExisting[0].id);
            return;
        }

        const set = setsManager.createLocalSet();
        set.name = 'Spaceman';
        const info = setsManager.getInfo(set.id);
        info.booklet = 'spaceman';
        store.dispatch('builderData/select_set', set.id);

        // Play the box open animation.
        fsm.switchTo('UNBOXED');
    }
}

const useMockWallet = () => {
    window.useDebugProvider();
}

    </script>

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        id="unboxGl"
        ref="canvas"
        @click="(event) => fsm.state?.onClick?.(event)"
        @pointermove="(event) => fsm.state?.onPointerMove?.(event)"/>
    <Transition name="fade">
        <div
            v-if="step === 'CHECK_WALLET' || step === 'LOADING'"
            class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-grad-lightest bg-repeat bg-auto alternate-buttons flex-col gap-4 bg-opacity-100 transition-all"
            :style="{ backgroundImage: `url(${BriqsOverlay})`, backgroundSize: '1000px auto' }">
            <h2>briq unboxing</h2>
            <p v-if="step === 'LOADING'">...Loading Scene...</p>
            <template v-else>
                <Btn @click="walletStore.openWalletSelector()">Connect your Wallet</Btn>
                <Btn v-if="APP_ENV !== 'prod'" @click="useMockWallet">Dev</Btn>
            </template>
        </div>
    </Transition>
    <div v-if="step === 'SAPIN'" class="flex justify-center items-center w-full absolute left-0 top-[70%] h-[30%] pointer-events-none gap-8">
        <Btn class="pointer-events-auto" @click="fsm.switchTo('UNBOXING')">Start Unboxing</Btn>
    </div>
    <div v-if="step === 'UNBOXED'" class="flex justify-center items-center w-full absolute left-0 top-[70%] h-[30%] pointer-events-none gap-8">
        <Btn class="pointer-events-auto" @click="router.push({ name: 'Builder' });">Start Building</Btn>
        <Btn secondary class="pointer-events-auto" @click="router.push({ name: 'Profile' });">Open Profile</Btn>
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
.xfade-enter-from {
    clip-path: polygon(-200% 0%, 0% 0%, -100% 100%, -300% 100%);
}
.xfade-enter-to,
.xfade-leave-from {
    clip-path: polygon(0% 0%, 200% 0%, 100% 100%, -100% 100%);
}
.xfade-leave-to {
    clip-path: polygon(200% 0%, 400% 0%, 300% 100%, 100% 100%);
}
.xfade-enter-active,
.xfade-leave-active {
    transition: clip-path 1.5s ease;
}

.fade-leave-from {
    opacity: 100%;
}
.fade-leave-to {
    opacity: 0%;
}
.fade-leave-active {
    transition: all 0.5s ease !important;
}
</style>
