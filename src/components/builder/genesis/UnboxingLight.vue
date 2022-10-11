<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { useBuilder } from '@/components/builder/BuilderComposable';
import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, graphicsFrame, resetGraphics, SceneQuality, setBox, generateCubes, generateBooklet, StopPhysics, sceneData, triggerBoom } from './UnboxingGraphicsLight';
import { APP_ENV } from '@/Meta';

import { userBoxesStore } from '@/builder/UserBoxes';
import { useGenesisStore } from '@/builder/GenesisStore';
import contractStore from '@/chain/Contracts';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { hexUuid } from '@/Uuid';
import { getBookletData, getBookletDataSync } from '@/builder/BookletData';


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
        const tg = new THREE.Quaternion(0, 1, 0, -0.12);
        const qt = sceneBox.quaternion.slerpQuaternions(this.rt, tg, this.step);
        sceneBox.quaternion.set(qt.x, qt.y, qt.z, qt.w);
        this.step += delta * 0.1;
        if (sceneBox.quaternion.angleTo(tg) === 0)
            fsm.switchTo('UNBOXING_OPEN')
    }
}

const unboxingOpenState = new class implements FsmState {
    time = 0;
    briqStep = 0;
    rt: any;
    genCubes = false;
    genBooklet = false;
    initialPos!: THREE.Vector3;
    deltaV = [];

    async onEnter() {
        getBookletData('starknet_city_ongoing/spaceman');
        this.rt = sceneBox.quaternion.clone();
        this.initialPos = sceneBox.position.clone();

        this.camPos = camera.position.clone();
        this.camQuat = camera.quaternion.clone();
    }

    frame(delta: number) {
        //delta *= 10;
        sceneBox.userData.mixer.update(delta);
        this.time += delta;

        {
            const ease = 1.0;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(Math.min(1.0, this.time / 4)).y;
            const pos = camera.position.lerpVectors(this.camPos, new THREE.Vector3(2.75, 2.25, 0.15), Math.min(1, easedTime));
            camera.position.set(pos.x, pos.y, pos.z);
            const quat = camera.quaternion.slerpQuaternions(this.camQuat, new THREE.Quaternion(-0.24, 0.67, 0.24, 0.66), Math.min(1, easedTime));
            camera.quaternion.set(quat.x, quat.y, quat.z, quat.w);

            scene.fog.near = 1.3 + easedTime * 1.7;
            scene.fog.far = 4.5 + easedTime * 0.5;
        }

        if (sceneBox.userData.mixer.time > 2.5 && this.briqStep < 1) {
            this.briqStep += delta / 2;

            const ease = 0.8;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(this.briqStep).y;
            const tg = this.rt.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 3));
            const qt = sceneBox.quaternion.slerpQuaternions(this.rt, tg, easedTime);
            sceneBox.quaternion.set(qt.x, qt.y, qt.z, qt.w);
            const tt = sceneBox.position.lerpVectors(this.initialPos, new THREE.Vector3(0, 0.7, -0.2), easedTime);
            sceneBox.position.set(tt.x, tt.y, tt.z);
        } else if (this.briqStep >= 4)
            fsm.switchTo('UNBOXED');
        else if (this.briqStep >= 1) {
            if (!this.genCubes && this.briqStep >= 1.0) {
                const colors = {};
                const briqs = getBookletDataSync('starknet_city_ongoing/spaceman').value.briqs;
                for (const briq of briqs)
                    colors[briq.data.color] = 1;
                generateCubes(Object.keys(colors));
                this.genCubes = true;
            }
            if (this.genBooklet && this.briqStep >= 1.8) {
                this.deltaV[0] = this.deltaV[1];
                this.deltaV[1] = sceneData.booklet.position.y;
                if (this.deltaV[1] - this.deltaV[0] > -0.001)
                    triggerBoom();
            }
            if (!this.genBooklet && this.briqStep >= 1.6) {
                generateBooklet();
                this.genBooklet = true;
                this.deltaV = [sceneData.booklet.position.y, sceneData.booklet.position.y];
            }
            this.briqStep += delta / 2;
        }
    }
}

const unboxedState = new class implements FsmState {
    async onEnter() {
        StopPhysics();
    }
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
import { camera } from '@/builder/graphics/Builder';
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
