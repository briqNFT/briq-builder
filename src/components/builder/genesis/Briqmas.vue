<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, onUnmounted } from 'vue';

import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, SceneQuality, graphicsFrame, resetGraphics, setBox, generateCubes, generateBooklet, StopPhysics, sceneData, triggerBoom } from './BriqmasGraphics';
import { APP_ENV } from '@/Meta';

import { useGenesisStore } from '@/builder/GenesisStore';

import BriqsImg from '@/assets/genesis/briqs.png';
import BriqsOverlay from '@/assets/landing/briqs.svg?url';
import { hexUuid } from '@/Uuid';
import { useRouter } from 'vue-router';
import { setsManager } from '@/builder/SetsManager';
import { useSetHelpers } from '../SetComposable';
import { useUnboxHelpers } from '@/builder/Unbox';
import Toggle from '@/components/generic/Toggle.vue';
import { bookletDataStore } from '@/builder/BookletData';
import { userBoxesStore } from '@/builder/UserBoxes';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';

//////////////////////////////
//////////////////////////////

const genesisStore = useGenesisStore();
const canvas = ref(null as unknown as HTMLCanvasElement);

let camera: THREE.PerspectiveCamera;

let setSceneReady: CallableFunction;
const sceneReady = new Promise((resolve) => {
    setSceneReady = resolve;
})

const router = useRouter();

const { openSetInBuilder } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();

const tokenName = 'briqmas/briqmas_tree';
const boxData = genesisStore.metadata[tokenName];
const bookletData = bookletDataStore['starknet-mainnet'][tokenName];

//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'NO_BOX' | 'SAPIN' | 'UNBOXING' | 'UNBOXING_OPEN' | 'UNBOXED' | 'OPEN_BUILDER';

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
        if (userBoxesStore.current?.availableBoxes.indexOf(tokenName) === -1)
            return fsm.switchTo('NO_BOX');

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

const unboxingState = new class implements FsmState {
    step = 0;

    camPos!: THREE.Vector3;
    camQuat!: THREE.Quaternion;

    curve!: THREE.CubicBezierCurve;

    targPos = new THREE.Vector3(-0.4651985807049573, 0.9106641122513064, -0.4608630977181946);
    targQuat = new THREE.Quaternion(-0.21513355823476782, 0.36465427428385455, 0.08699554956570354, 0.9017630435560798);

    duration = 3.0;
    async onEnter() {
        this.camPos = camera.position.clone();
        this.camQuat = camera.quaternion.clone();

        const ease = 1.0;
        this.curve = new THREE.CubicBezierCurve(
            new THREE.Vector2(0, 0),
            new THREE.Vector2(ease, 0),
            new THREE.Vector2(1 - ease, 1),
            new THREE.Vector2(1, 1),
        );
    }

    frame(delta: number) {
        if (this.step >= this.duration)
            return;
        const point = this.curve.getPointAt(this.step / this.duration).y;
        camera.position.lerpVectors(this.camPos, this.targPos, point);
        camera.quaternion.slerpQuaternions(this.camQuat, this.targQuat, point);
        camera.fov = THREE.MathUtils.lerp(40, 30, point);
        camera.updateProjectionMatrix();
        this.step += delta;
    }
}

const unboxingOpenState = new class implements FsmState {
    time = 0;
    briqStep = 0;
    boxMoveStep = 0;
    c2 = 0;
    rt: THREE.Quaternion;
    genCubes = false;
    genBooklet = false;
    lastMoveOn = 0;
    initialPos!: THREE.Vector3;
    deltaV = [];

    camPos!: THREE.Vector3;
    camQuat!: THREE.Quaternion;

    camFov!: number;

    async onEnter() {
        this.rt = sceneData.box!.quaternion.clone();
        this.initialPos = sceneData.box!.position.clone();

        this.camPos = camera.position.clone();
        this.camQuat = camera.quaternion.clone();
        this.camFov = camera.fov;
    }

    frame(delta: number) {
        this.time += delta;

        // Camera movement - step 1
        if (!this.genCubes && this.time < 4) {
            const ease = 1.0;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(Math.min(1.0, this.time / 4)).y;
            camera.position.lerpVectors(this.camPos, new THREE.Vector3(-0.72, 1.33, 0.94), Math.min(1, easedTime));
            //camera.quaternion.slerpQuaternions(this.camQuat, new THREE.Quaternion(-0.22, 0.082, 0.0185, 0.97), Math.min(1, easedTime));
            camera.quaternion.slerpQuaternions(this.camQuat, new THREE.Quaternion(-0.214, 0.148, 0.033, 0.965), Math.min(1, easedTime));
            camera.fov = THREE.MathUtils.lerp(this.camFov, 40, Math.min(1, easedTime));
            camera.updateProjectionMatrix();
        }

        // Box movement
        if (this.time > 1.0 && this.boxMoveStep < 1) {
            sceneData.box!.userData.mixer.update(delta);

            this.boxMoveStep += delta / 2;

            const ease = 0.8;
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(ease, 0),
                new THREE.Vector2(1 - ease, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(this.boxMoveStep).y;

            const rot = this.rt.clone();
            rot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
            rot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 2 * -Math.PI / 3));
            // point down
            rot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 5));
            // slightly flatten
            rot.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.2));

            sceneData.box!.quaternion.slerpQuaternions(this.rt, rot, easedTime);
            sceneData.box!.position.lerpVectors(this.initialPos, new THREE.Vector3(-0.65, 0.8, -0.5), easedTime);
        }

        if (this.time >= 4.0) {
            // Spawn cubes early
            if (!this.genCubes && this.briqStep >= 0) {
                const colors = {};
                for (const briq of bookletData._data.briqs)
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

        // Camera movement - step 2
        if (this.genCubes && !this.lastMoveOn) {
            this.lastMoveOn = 1;
            setTimeout(() => this.lastMoveOn = 2, 1000);
            this.camPos = camera.position.clone();
            this.camQuat = camera.quaternion.clone();
        }

        if (this.lastMoveOn >= 2) {
            const curve = new THREE.CubicBezierCurve(
                new THREE.Vector2(0, 0),
                new THREE.Vector2(1, 0),
                new THREE.Vector2(0, 1),
                new THREE.Vector2(1, 1),
            );
            const easedTime = curve.getPoint(Math.min(1.0, this.c2 / 5.0)).y;
            camera.position.lerpVectors(this.camPos, new THREE.Vector3(-0.12, 0.4, -0.23), Math.min(1, easedTime));
            camera.quaternion.slerpQuaternions(this.camQuat, new THREE.Quaternion(-0.1, 0.495, 0.058, 0.86), Math.min(1, easedTime));
            this.c2 += delta;
        }

        if (this.time >= 11)
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
            let set = setsManager.getBookletSet(tokenName);
            if (!set)
                openSetInBuilder(createBookletSet(tokenName, boxData._data!.name, boxData._data!.description));
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
            'NO_BOX': noBoxState,
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

    await setupScene();

    await bookletData._fetch;
    await boxData._fetch;

    const graphicsBoxData = {
        uid: hexUuid(),
        box_name: tokenName,
        position: [0, 0, 0],
        texture: genesisStore.boxTexture(tokenName),
        bookletTexture: genesisStore.bookletTexture(tokenName),
    };
    sceneData.box! = await setBox(graphicsBoxData);

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


const termsBriq = ref(false);

const { unbox, fakeUnbox } = useUnboxHelpers();
const disableButtons = ref(false);

const doUnbox = async () => {
    disableButtons.value = true;
    try {
        await unbox(tokenName);
        fsm.switchTo('UNBOXING_OPEN');
    } catch(_) {
        if (APP_ENV === 'dev')
            console.error(_);
    }
    disableButtons.value = false;
}
const doFakeUnbox = async () => {
    //await fakeUnbox(tokenName);
    fsm.switchTo('UNBOXING_OPEN');
}

const openBuilder = async () => {
    fsm.switchTo('OPEN_BUILDER')
}


import FireplaceAudio from './FireplaceAudio.vue';
const quality = ref(SceneQuality.HIGH);

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
        <div class="absolute bottom-0 right-0 text-white" @click="$forceUpdate()">
            {{ camera.position }}
            {{ camera.quaternion }}
        </div>
    </template>
    <Transition appear name="fade">
        <div v-if="step === 'SAPIN'">
            <div class="fixed right-0 top-0 m-8 shadow bg-grad-lightest rounded-md p-6 max-w-[23rem] text-md leading-snug">
                <p class="mb-2">The sounds of the fireplace. Outside, the stars twinkle.</p>
                <p class="mb-2">Today is <span class="text-primary font-medium">briqmas</span>, 2022.</p>
                <p class="mb-2">By the tree a gift was left. <br>It is yours to open.</p>
                <div class="mt-8 flex justify-between">
                    <RouterLink to="/profile?tab=GENESIS"><Btn secondary class="pointer-events-auto font-normal !text-sm" :disabled="disableButtons">Back to inventory</Btn></RouterLink>
                    <Btn class="pointer-events-auto !text-sm" @click="fsm.switchTo('UNBOXING')">Get Closer</Btn>
                </div>
            </div>
        </div>
        <div v-else-if="step === 'UNBOXING'">
            <div class="fixed right-0 top-0 m-8 shadow bg-grad-lightest rounded-md p-6 max-w-[23rem] text-md leading-snug">
                <p class="mb-2">A briq box! You did not expect that.</p>
                <p>Inside, the box says, some briqs and an instruction booklet.</p>
                <h5 class="mt-6 mb-3 font-medium">Terms and conditions</h5>
                <div class="text-sm flex flex-col gap-4">
                    <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
                </div>
                <div class="mt-8 flex justify-between">
                    <RouterLink to="/profile?tab=GENESIS"><Btn secondary class="pointer-events-auto font-normal !text-sm" :disabled="disableButtons">Back to inventory</Btn></RouterLink>
                    <Btn class="pointer-events-auto !text-sm" @click="doUnbox" :disabled="disableButtons || !termsBriq">Unbox</Btn>
                </div>
            </div>
        </div>
        <div v-else-if="step === 'UNBOXED'" class="flex flex-col justify-center items-center w-full absolute left-0 top-[10%] pointer-events-none gap-8">
            <p>Here's what's inside your box</p>
            <div class="grid grid-cols-2 gap-6">
                <div class="flex flex-col gap-6">
                    <div class="bg-grad-lightest shadow rounded-md w-[14rem] h-[14rem] p-6">
                        <p class="text-center font-semibold">Booklet <span class="font-normal">x 1</span></p>
                        <div class="flex h-full justify-center items-center"><img :src="genesisStore.coverBookletRoute(tokenName)"></div>
                    </div>
                    <Btn secondary class="pointer-events-auto h-14" @click="router.push({ name: 'Profile' });">Open Profile</Btn>
                </div>
                <div class="flex flex-col gap-6">
                    <div class="bg-grad-lightest shadow rounded-md w-[14rem] h-[14rem] p-6">
                        <p class="text-center font-semibold">Briqs <span class="font-normal">x {{ boxData._data!.nb_briqs }}</span></p>
                        <div class="flex h-full justify-center items-center"><img class="max-w-[5rem]" :src="BriqsImg"></div>
                    </div>
                    <Btn class="pointer-events-auto h-14" @click="openBuilder">Start building</Btn>
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
    transition: all 2.5s ease !important;
}
</style>
