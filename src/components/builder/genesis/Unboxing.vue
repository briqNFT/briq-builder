<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { reactive, shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, h, watchEffect, shallowRef, WatchStopHandle, onUnmounted } from 'vue';

import { useBuilder } from '@/components/builder/BuilderComposable';
import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, addBox, materials, graphicsFrame, getBoxAt, resetGraphics, SceneQuality, boxMaterials, boxTexture } from './UnboxingGraphics';
import LookAtBoxVue from './Texts/LookAtBox.vue';
import { hexUuid } from '@/Uuid';
import WalletsVue from './Texts/Wallets.vue';
import BeforeActualUnboxVue from './Texts/BeforeActualUnbox.vue';
import AfterUnboxVue from './Texts/AfterUnbox.vue';

import { APP_ENV } from '@/Meta';

import { userBoxesStore } from '@/builder/UserBoxes';
import { useGenesisStore } from '@/builder/GenesisStore';
import contractStore from '@/chain/Contracts';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';


//////////////////////////////
//////////////////////////////

const genesisStore = useGenesisStore();

const chapters = reactive([] as { uid: string, active: boolean, component: any }[]);

const addChapter = (component: any) => {
    chapters.push(
        {
            uid: hexUuid(),
            active: true,
            component,
        },
    )
    return chapters[chapters.length - 1];
}

const canvas = ref(null as unknown as HTMLCanvasElement);

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;

const boxes = reactive([]);

let setSceneReady: CallableFunction;
const sceneReady = new Promise((resolve) => {
    setSceneReady = resolve;
})

const lastCamRot = ref(null as unknown as THREE.Quaternion);
const lastCamPos = ref(null as unknown as THREE.Vector3);
const currentCamRot = ref(null as unknown as THREE.Quaternion);
const currentCamPos = ref(null as unknown as THREE.Vector3);
const camInterp = ref(0);

const selectedObject = shallowRef(undefined as THREE.Mesh | undefined);
const hoveredObject = shallowRef(undefined as THREE.Mesh | undefined);

const quality = ref(SceneQuality.HIGH);

//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'SAPIN' | 'CHECK_BOX' | 'UNBOXING' | 'UNBOXED';

interface FsmState {
    onEnter(): Promise<any>;
    onLeave?: (to: string) => Promise<void>;
    frame?: (delta: number) => void;
    onClick?: (event: PointerEvent) => void;
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
        const pos = [
            [0.4, 0.07, 1.8],
            [1.3, 0.07, 1.0],
            [0.7, 0.07, 1.2],
            [0.45, 0.245, 1.83],
            [1.33, 0.245, 0.98],
            [0.74, 0.245, 1.18],
            [0.4, 0.42, 1.8],
            [1.3, 0.42, 1.0],
            [0.7, 0.42, 1.2],
        ]
        const boxesData = userBoxesStore.current?.availableBoxes.map((token_id, i) => ({
            uid: hexUuid(),
            box_token_id: token_id,
            box_name: token_id.endsWith('1') ? 'starknet_city/spaceman' : 'starknet_city/base_module_1',
            position: pos[i],
        })) || [];
        for (const box of boxesData)
            boxes.push(addBox(box, scene));

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

        await this.hasEnoughFrames;
        this.fps.sort((a, b) => b - a);
        let medianFPS = this.fps[Math.floor(this.fps.length / 2)];

        if (medianFPS > 25) {
            // Switch to lower quality scene.
            quality.value = SceneQuality.MEDIUM;
            await setupScene(quality.value);

            this.hasEnoughFrames = new Promise((resolve, _) => {
                this.setEnoughFrames = resolve;
            });
            this.fps.length = 0;
            await this.hasEnoughFrames;
            this.fps.sort((a, b) => b - a);
            medianFPS = this.fps[Math.floor(this.fps.length / 2)];
            if (medianFPS > 25) {
                quality.value = SceneQuality.LOW;
                await setupScene(quality.value);
            }
        } else if (medianFPS < 18) {
            // Try ultra
            quality.value = SceneQuality.ULTRA;
            await setupScene(quality.value);
            this.hasEnoughFrames = new Promise((resolve, _) => {
                this.setEnoughFrames = resolve;
            });
            this.fps.length = 0;
            await this.hasEnoughFrames;
            this.fps.sort((a, b) => b - a);
            medianFPS = this.fps[Math.floor(this.fps.length / 2)];
            if (medianFPS > 20) {
                // Reset to high
                quality.value = SceneQuality.HIGH;
                await setupScene(quality.value);
            }
        }

        // use a timeout -> We use this to cheat and hopefully load the box textures.
        return setTimeout(() => fsm.switchTo('SAPIN'), 100);
    }

    async onLeave() {
        setTimeout(() => addChapter(
            h('dic', [
                h('p', ['Today is Christmas, 1995.', h('br'), 'Your gifts have been left by the tree, and are waiting for you.']),
                h('p', { class: 'my-2' }, ['The hour is now, and by the fireplace you may open them.', h('br'), 'Let your imagination roam free.']),
            ]),
        ), 250);
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
    async onEnter() {
        camera.getWorldPosition(lastCamPos.value);
        camera.getWorldQuaternion(lastCamRot.value);
        camInterp.value = 0;
        camera.position.set(-2, 1.8, -2);
        camera.lookAt(new THREE.Vector3(2, 0, 2));
        currentCamPos.value = camera.position.clone();
        camera.getWorldQuaternion(currentCamRot.value);
        this.setCam();
    }

    setCam() {
        const pos = new THREE.Vector3().lerpVectors(lastCamPos.value, currentCamPos.value, camInterp.value);
        camera.position.set(pos.x, pos.y, pos.z);
        const quat = new THREE.Quaternion().slerpQuaternions(lastCamRot.value, currentCamRot.value, camInterp.value);
        camera.setRotationFromQuaternion(quat);
    }

    frame(delta: number) {
        if (camInterp.value < 1)
            camInterp.value = Math.min(1.0, camInterp.value + delta);
        this.setCam();
    }

    onClick(event: PointerEvent) {
        let box = getBoxAt(event);
        selectedObject.value = box;
        if (box)
            return fsm.switchTo('CHECK_BOX');

    }

    onPointerMove(event: PointerEvent) {
        let box = getBoxAt(event);
        hoveredObject.value = box;
    }
}

const checkBoxState = new class implements FsmState {
    initialChapter: any;
    async onEnter() {
        this.initialChapter = addChapter(
            h(LookAtBoxVue, {
                startUnbox: start_unbox,
                boxName: selectedObject.value?.userData.box_name,
            }),
        );

        camera.getWorldPosition(lastCamPos.value);
        camera.getWorldQuaternion(lastCamRot.value);
        camInterp.value = 0;
        camera.position.set(selectedObject.value?.position.x - 1.0, selectedObject.value?.position.y + 1.0, selectedObject.value?.position.z - 1.0);
        camera.lookAt(new THREE.Vector3(
            selectedObject.value?.position.x,
            selectedObject.value?.position.y,
            selectedObject.value?.position.z,
        ));
        currentCamPos.value = camera.position.clone();
        camera.getWorldQuaternion(currentCamRot.value);
        this.setCam();

        hoveredObject.value = undefined;
    }

    async onLeave(to: string) {
        this.initialChapter.active = false;
        if (to !== 'UNBOXING')
            chapters.splice(chapters.findIndex(x => x.uid === this.initialChapter.uid), 1);
    }

    setCam() {
        const pos = new THREE.Vector3().lerpVectors(lastCamPos.value, currentCamPos.value, camInterp.value);
        camera.position.set(pos.x, pos.y, pos.z);
        const quat = new THREE.Quaternion().slerpQuaternions(lastCamRot.value, currentCamRot.value, camInterp.value);
        camera.setRotationFromQuaternion(quat);
    }

    frame(delta: number) {
        if (camInterp.value < 1)
            camInterp.value = Math.min(1.0, camInterp.value + delta);
        this.setCam();
    }

    onClick(event: PointerEvent) {
        let box = getBoxAt(event);
        const lastSel = selectedObject.value;
        selectedObject.value = box;
        if (box && box.uuid !== lastSel?.uuid)
            return fsm.switchTo('CHECK_BOX');
        else if (!box)
            return fsm.switchTo('SAPIN');
    }

    onPointerMove(event: PointerEvent) {
        let box = getBoxAt(event);
        hoveredObject.value = box;
    }
}

const unboxingState = new class implements FsmState {
    chapters = [];
    async onEnter() {
        this.chapters.push(addChapter(
            h(WalletsVue),
        ));
        this.chapters.push(addChapter(
            h(BeforeActualUnboxVue, {
                unbox: unbox,
            }),
        ));
    }

    async onLeave() {
        this.chapters.forEach(x => x.active = false);
    }

    frame(delta: number) {
    }

    onClick(event: PointerEvent) {
        let box = getBoxAt(event);
        const lastSel = selectedObject.value;
        selectedObject.value = box;
        if (box && box.uuid !== lastSel?.uuid)
            return fsm.switchTo('CHECK_BOX');
        else if (!box)
            return fsm.switchTo('SAPIN');
    }

    onPointerMove(event: PointerEvent) {
        let box = getBoxAt(event);
        hoveredObject.value = box;
    }
}

const unboxedState = new class implements FsmState {
    async onEnter() {
        addChapter(
            h(AfterUnboxVue, {
                goToBuilder: goToBuilder,
            }),
        )
    }

    frame(delta: number) {
        selectedObject.value?.userData.mixer.update(delta);
    }

    onClick(event: PointerEvent) {
        let box = getBoxAt(event);
        const lastSel = selectedObject.value;
        selectedObject.value = box;
        if (box && box.uuid !== lastSel?.uuid)
            return fsm.switchTo('CHECK_BOX');
        else if (!box)
            return fsm.switchTo('SAPIN');
    }

    onPointerMove(event: PointerEvent) {
        let box = getBoxAt(event);
        hoveredObject.value = box;
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
            'CHECK_BOX': checkBoxState,
            'UNBOXING': unboxingState,
            'UNBOXED': unboxedState,
        }[state];
        this.stateName = state;
        await this.state.onEnter();
    }
});

const step = computed(() => fsm.stateName);

//////////////////////////////
//////////////////////////////

let initFsm: Promise<void>;

let walletWatcher: WatchStopHandle;
let boxWatcher: WatchStopHandle;

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

    boxWatcher = watchEffect(() => {
        if (selectedObject.value)
            for (const box of boxes)
                if (selectedObject.value?.uuid === box.uuid) {
                    box.children[1].children[0].material = boxMaterials.default[0].clone();
                    box.children[1].children[1].material = boxMaterials.default[1];
                    box.children[1].children[0].material.map = boxTexture[box.userData.box_name].texture;
                    box.children[1].children[0].receiveShadow = false;
                } else {
                    box.children[1].children[0].material = boxMaterials.hidden[0].clone();
                    box.children[1].children[1].material = boxMaterials.hidden[1];
                    box.children[1].children[0].material.map = boxTexture[box.userData.box_name].texture;
                    box.children[1].children[0].receiveShadow = true;
                }
        else
            for (const box of boxes) {
                box.children[1].children[0].material = boxMaterials.default[0].clone();
                box.children[1].children[1].material = boxMaterials.default[1];
                box.children[1].children[0].material.map = boxTexture[box.userData.box_name].texture;
                box.children[1].children[0].receiveShadow = true;
            }
        if (hoveredObject.value?.uuid)
            for (const box of boxes)
                if (hoveredObject.value?.uuid === box.uuid)
                    if (selectedObject.value?.uuid !== box.uuid) {
                        box.children[1].children[0].material = boxMaterials.hovered[0].clone();
                        box.children[1].children[0].material.map = boxTexture[box.userData.box_name].texture;
                    }
    })
});

import Stats from 'stats.js';

let lastTime: number;
let mounted = false;
onMounted(async () => {
    mounted = true;
    await initFsm;
    const setupData = await useRenderer(canvas.value);
    camera = setupData.camera;
    scene = setupData.scene;

    await setupScene();

    lastCamRot.value = new THREE.Quaternion();
    lastCamPos.value = new THREE.Vector3();
    currentCamRot.value = new THREE.Quaternion();
    currentCamPos.value = new THREE.Vector3();
    camera.getWorldQuaternion(lastCamRot.value);
    camera.getWorldPosition(lastCamPos.value);
    camera.getWorldQuaternion(currentCamRot.value);
    camera.getWorldPosition(currentCamPos.value);

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
    boxWatcher();
    mounted = false;
})


import FireplaceAudio from './FireplaceAudio.vue';

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
    <template v-if="step !== 'CHECK_WALLET' && step !== 'LOADING'">
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
    <div
        id="unboxing"
        class="absolute top-0 right-0 xl:w-[30%] w-[400px] bg-black bg-opacity-40 h-screen overflow-auto snap-y transition-all scroll-smooth"
        @click.stop="">
        <div class="snap-end text text-base pb-[15rem] px-8 py-4">
            <h2 class="text-center my-8">briq unboxing</h2>
            <TransitionGroup name="xfade">
                <div v-for="chapter, i of chapters" :key="i">
                    <component :is="chapter.component" :active="chapter.active"/>
                </div>
            </TransitionGroup>
        </div>
    </div>
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
