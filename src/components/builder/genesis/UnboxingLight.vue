<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, graphicsFrame, resetGraphics, setBox, generateCubes, generateBooklet, StopPhysics, sceneData, triggerBoom } from './UnboxingGraphicsLight';
import { APP_ENV } from '@/Meta';

import { useGenesisStore } from '@/builder/GenesisStore';

import BriqsImg from '@/assets/genesis/briqs.png';
import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { hexUuid } from '@/Uuid';
import { getBookletData, getBookletDataSync } from '@/builder/BookletData';
import { useRoute, useRouter } from 'vue-router';
import { setsManager } from '@/builder/SetsManager';
import { useSetHelpers } from '../SetComposable';
import { pushModal } from '@/components/Modals.vue';
import UnboxModalVue from './UnboxModal.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import Toggle from '@/components/generic/Toggle.vue';
import { featureFlags } from '@/FeatureFlags';


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

let sceneBox: THREE.Object3D;

const route = useRoute();
const router = useRouter();

const boxId = computed(() => `${route.params.theme}/${route.params.box}`);

const boxMetadata = genesisStore.metadata[boxId.value];

const { openSetInBuilder } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();


//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'SAPIN' | 'UNBOXING' | 'UNBOXING_OPEN' | 'UNBOXED' | 'OPEN_BUILDER';

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
    boxMoveStep = 0;
    c2 = 0;
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

        // Camera movement - step 1
        if (!this.genCubes) {
            const ease = 1.0;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(Math.min(1.0, this.time / 4)).y;
            camera.position.lerpVectors(this.camPos, new THREE.Vector3(2.75, 2.25, 0.15), Math.min(1, easedTime));
            camera.quaternion.slerpQuaternions(this.camQuat, new THREE.Quaternion(-0.24, 0.67, 0.24, 0.66), Math.min(1, easedTime));

            scene.fog.near = 1.3 + easedTime * 1.7;
            scene.fog.far = 4.5 + easedTime * 0.5;
        }

        // Camera movement - step 2
        if (this.genCubes) {
            const ease = 1.0;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(1.3, 0),
                new THREE.Vector2(0.7, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(Math.min(1.0, this.c2 / 8)).y;
            //camera.position.lerpVectors(new THREE.Vector3(2.75, 2.25, 0.15), new THREE.Vector3(1.6, 1.6, 0.3), Math.min(1, easedTime));
            //camera.quaternion.slerpQuaternions(new THREE.Quaternion(-0.24, 0.67, 0.24, 0.66), new THREE.Quaternion(-0.36, 0.584, 0.326, 0.65), Math.min(1, easedTime));
            camera.position.lerpVectors(new THREE.Vector3(2.75, 2.25, 0.15), new THREE.Vector3(2.42, 0.105, 0.43), Math.min(1, easedTime));
            camera.quaternion.slerpQuaternions(new THREE.Quaternion(-0.24, 0.67, 0.24, 0.66), new THREE.Quaternion(-0.06, 0.62, 0.047, 0.78), Math.min(1, easedTime));
            //scene.fog.near = 1.3 + easedTime * 1.7;
            //scene.fog.far = 4.5 + easedTime * 0.5;
            this.c2 += delta;
        }
        // Box movement
        if (sceneBox.userData.mixer.time > 2.5 && this.boxMoveStep < 1) {
            this.boxMoveStep += delta / 2;

            const ease = 0.8;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(this.boxMoveStep).y;
            const tg = this.rt.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 3));
            tg.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.2));
            tg.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.2));
            sceneBox.quaternion.slerpQuaternions(this.rt, tg, easedTime);
            sceneBox.position.lerpVectors(this.initialPos, new THREE.Vector3(0, 0.7, -0.2), easedTime);
        }

        if (this.boxMoveStep >= 1.0) {
            // Spawn cubes early
            if (!this.genCubes && this.briqStep >= 0) {
                const colors = {};
                const briqs = getBookletDataSync('starknet_city_ongoing/spaceman').value.briqs;
                for (const briq of briqs)
                    colors[briq.data.color] = 1;
                generateCubes(Object.keys(colors));
                this.genCubes = true;
            }

            // Trigger 'boom' effect when booklet hits the ground
            if (this.genBooklet && this.briqStep >= 1.0) {
                this.deltaV[0] = this.deltaV[1];
                this.deltaV[1] = sceneData.booklet.position.y;
                if (this.deltaV[1] - this.deltaV[0] > -0.001)
                    triggerBoom();
            }
            // Spawn booklet a little while after briqs
            if (!this.genBooklet && this.briqStep >= 0.8) {
                generateBooklet();
                this.genBooklet = true;
                this.deltaV = [sceneData.booklet.position.y, sceneData.booklet.position.y];
            }
            this.briqStep += delta / 2;
        }

        if (this.time >= 13.5)
            fsm.switchTo('UNBOXED');

    }
}

const unboxedState = new class implements FsmState {
    async onEnter() {
        StopPhysics();
    }
    frame(delta: number) {}
}


const openBuilderState = new class implements FsmState {
    time = 0;
    easedTime = ref(0);

    camPos!: THREE.Vector3;
    tpos!: THREE.Vector3;
    intermediatePos!: THREE.Vector3;

    camRot!: THREE.Quaternion;
    tRot!: THREE.Quaternion;
    intermediateRot!: THREE.Quaternion;

    step1curve!: THREE.CubicBezierCurve;
    step2curve!: THREE.CubicBezierCurve;

    step1time!: number;
    step2time!: number;
    async onEnter() {
        this.camPos = camera.position.clone();
        this.camRot = camera.quaternion.clone();

        this.tpos = sceneData.booklet!.position.clone();
        this.tRot = sceneData.booklet!.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));

        this.intermediatePos = this.tpos.clone().lerp(this.camPos, 0.05);
        this.intermediatePos.add(new THREE.Vector3(0, 1, 0));
        this.intermediateRot = this.camRot.clone().slerp(this.tRot, 0.9);

        this.step1curve = new THREE.CubicBezierCurve(
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1.0, 0),
            new THREE.Vector2(0.0, 1),
            new THREE.Vector2(1, 1),
        );

        this.step2curve = new THREE.CubicBezierCurve(
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1.0, 0),
            new THREE.Vector2(1.0, 0.5),
            new THREE.Vector2(1, 1),
        );

        this.step1time = 1.7;
        this.step2time = 0.8;
    }

    frame(delta: number) {
        // Camera movement - step 1

        if (this.time < this.step1time) {
            const easedTime = this.step1curve.getPoint(Math.min(1.0, this.time / this.step1time)).y;
            camera.position.lerpVectors(this.camPos, this.intermediatePos, Math.min(1, easedTime));
            camera.quaternion.slerpQuaternions(this.camRot, this.intermediateRot, Math.min(1, easedTime));
        } else if (this.time < this.step1time + this.step2time) {
            const easedTime = this.step2curve.getPoint(Math.min(1.0, (this.time - this.step1time) / (this.step2time))).y;
            this.easedTime.value = easedTime;
            camera.position.lerpVectors(this.intermediatePos, this.tpos, Math.min(1, easedTime));

            camera.near = Math.max(0.0001, 0.3 - easedTime * 0.3);
            camera.far = 100 - easedTime * 99.9;
        }

        if (this.time >= this.step1time + this.step2time) {
            let set = setsManager.getBookletSet(boxId.value);
            if (!set)
                openSetInBuilder(createBookletSet(boxId.value, boxMetadata._data!.name, boxMetadata._data!.description));
            else
                openSetInBuilder(set.id);
        }

        this.time += delta / 2;
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
            'SAPIN': sapinState,
            'UNBOXING': unboxingState,
            'UNBOXING_OPEN': unboxingOpenState,
            'UNBOXED': unboxedState,
            'OPEN_BUILDER': openBuilderState,
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
    camera = setupData.camera;
    scene = setupData.scene;

    await setupScene();

    await boxMetadata._fetch;

    const boxData = {
        uid: hexUuid(),
        box_token_id: boxMetadata._data!.token_id,
        box_name: boxId.value,
        position: [0, 0, 0],
        texture: genesisStore.boxTexture(boxId.value),
        bookletTexture: genesisStore.bookletTexture(boxId.value),
    };
    sceneBox = await setBox(boxData);

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


const termsSale = ref(false);
const termsBriq = ref(false);

const { unbox, fakeUnbox } = useUnboxHelpers();
const disableButtons = ref(false);

const doUnbox = async () => {
    disableButtons.value = true;
    try {
        await unbox(boxId.value);
        fsm.switchTo('UNBOXING');
    } catch(_) { /**/ }
    disableButtons.value = false;
}
const doFakeUnbox = async () => {
    await fakeUnbox(boxId.value);
    fsm.switchTo('UNBOXING');
}

const openBuilder = async () => {
    fsm.switchTo('OPEN_BUILDER')
}

const useMockWallet = () => {
    window.useDebugProvider();
}

</script>

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        ref="canvas"
        @click="(event) => fsm.state?.onClick?.(event)"
        @pointermove="(event) => fsm.state?.onPointerMove?.(event)"/>
    <!-- preload -->
    <div class="hidden absolute"><img :src="genesisStore.coverBookletRoute(boxId)"></div>
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
    <Transition appear name="fade">
        <div v-if="step === 'SAPIN'">
            <div class="fixed right-0 top-0 m-8 shadow bg-grad-lightest rounded-md p-6 max-w-[27rem]">
                <h4 class="text-md mb-6">Unboxing</h4>
                <p>Unboxing this <span class="font-medium">{{ boxMetadata._data?.name }}</span> box will burn it forever.<br>In exchange, its content will be available to you.</p>
                <h5 class="mt-6 mb-3 font-medium">Terms and conditions</h5>
                <div class="text-sm flex flex-col gap-4">
                    <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
                    <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
                </div>
                <div class="mt-8 flex justify-between">
                    <RouterLink to="/profile?tab=GENESIS"><Btn secondary class="pointer-events-auto font-normal !text-sm" :disabled="disableButtons">Back to inventory</Btn></RouterLink>
                    <Btn no-background v-if="featureFlags.adminOnly" class="pointer-events-auto !text-sm" @click="doFakeUnbox" :disabled="disableButtons || !termsSale || !termsBriq">Fakeunbox</Btn>
                    <Btn class="pointer-events-auto !text-sm" @click="doUnbox" :disabled="disableButtons || !termsSale || !termsBriq">Unbox</Btn>
                </div>
            </div>
        </div>
        <div v-else-if="step === 'UNBOXED'" class="flex flex-col justify-center items-center w-full absolute left-0 top-[10%] pointer-events-none gap-8">
            <p>Here's what's inside your box</p>
            <div class="grid grid-cols-2 gap-6">
                <div class="flex flex-col gap-6">
                    <div class="bg-grad-lightest shadow rounded-md w-[14rem] h-[14rem] p-6">
                        <p class="text-center font-semibold">Booklet <span class="font-normal">x 1</span></p>
                        <div class="flex h-full justify-center items-center"><img :src="genesisStore.coverBookletRoute(boxId)"></div>
                    </div>
                    <Btn secondary class="pointer-events-auto h-14" @click="router.push({ name: 'Profile' });">Open Profile</Btn>
                </div>
                <div class="flex flex-col gap-6">
                    <div class="bg-grad-lightest shadow rounded-md w-[14rem] h-[14rem] p-6">
                        <p class="text-center font-semibold">Briqs <span class="font-normal">x {{ boxMetadata._data?.nb_briqs }}</span></p>
                        <div class="flex h-full justify-center items-center"><img class="max-w-[5rem]" :src="BriqsImg"></div>
                    </div>
                    <Btn class="pointer-events-auto h-14" @click="openBuilder">Start Building</Btn>
                </div>
            </div>
        </div>
        <div v-else-if="step === 'OPEN_BUILDER'" class="absolute h-screen w-screen bg-grad-lightest" :style="`opacity: ${Math.min(1, (fsm.state.easedTime?.value ?? 0) * (fsm.state.easedTime?.value ?? 0))};`"/>
    </Transition>
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

.fade-enter-to, .fade-leave-from {
    opacity: 100%;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0%;
}
.fade-enter-active, .fade-leave-active {
    transition: all 0.5s ease !important;
}
</style>
