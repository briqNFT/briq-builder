<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { reactive, shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, h, watchEffect, nextTick } from 'vue';

import { useBuilder } from '@/builder/BuilderStore';
import { walletStore } from '@/chain/Wallet';

import { setupScene, useRenderer, addBox, materials } from './UnboxingGraphics';
import LookAtBoxVue from './Texts/LookAtBox.vue';
import { hexUuid } from '@/Uuid';
import WalletsVue from './Texts/Wallets.vue';
import BeforeActualUnboxVue from './Texts/BeforeActualUnbox.vue';
import AfterUnboxVue from './Texts/AfterUnbox.vue';

import { APP_ENV } from '@/Meta';

import { genesisUserStore, useGenesisStore } from '@/builder/GenesisStore';
import contractStore from '@/chain/Contracts';

import BriqsOverlay from '@/assets/landing/briqs.svg?url';

//////////////////////////////
//////////////////////////////

const updateLights = (delta: number) => {
    const intensity = Math.random() > 0.8 ? 0.2 : 0.01;

    chimneyLight.position.set(
        2.5 + (Math.random() * intensity - intensity/2) * 0.0,
        0.5 + (Math.random() * intensity - intensity/2) * 0.1,
        0.6 + (Math.random() * intensity - intensity/2) * 0.1,
    );
    chimneyLight.intensity = Math.random() * 0.3 + 0.85;
}

const getBoxAt = (event: PointerEvent) => {
    const rc = new THREE.Raycaster();
    const cv = canvas.value as unknown as HTMLCanvasElement;
    rc.setFromCamera({ x: event.clientX / cv.clientWidth * 2 - 1.0, y: event.clientY / cv.clientHeight * - 2 + 1.0 }, camera);
    for(const box of boxes)
        if (rc.ray.intersectsBox(box.userData.bb))
            return box;

    return undefined;
}


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
let chimneyLight: THREE.PointLight;
let boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D };

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

const selectedObject = ref(undefined as THREE.Mesh | undefined);
const hoveredObject = ref(undefined as THREE.Mesh | undefined);

//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'SAPIN' | 'CHECK_BOX' | 'UNBOXING' | 'UNBOXED';

interface FsmState {
    onEnter(): Promise<void>;
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
        const userData = genesisUserStore.fetchData();
        await sceneReady;
        await userData;
        const pos = [
            [0.5, 0.07, 1.4],
            [1.2, 0.07, 1.2],
        ]
        const boxesData = genesisUserStore.availableBoxes.map((token_id, i) => ({
            uid: hexUuid(),
            box_token_id: token_id,
            box_name: token_id.endsWith('1') ? 'starknet_city/spaceman' : 'starknet_city/base_module_1',
            position: pos[i],
        }));
        for (const box of boxesData)
            boxes.push(addBox(box, scene, boxGlb));

        const loader = new THREE.TextureLoader();
        boxesData.forEach(data => {
            loader.loadAsync(genesisStore.boxTexture(data.box_name)).then(x => {
                materials[data.box_name].forEach(mat => {
                    x.encoding = THREE.sRGBEncoding;
                    x.flipY = false;
                    mat.map = x;
                    mat.needsUpdate = true;
                })
            });
        });

        await this.hasEnoughFrames;
        const avgFps = this.fps.reduce((prev, cur) => prev + cur) / this.fps.length;
        const minFps = this.fps.reduce((prev, cur) => Math.min(prev, cur), this.fps[0]);
        console.log('avgFps', avgFps, 'minFps', minFps, this.fps);

        if (true || minFps > 20 || avgFps > 25) {
            // Switch to lower quality scene.
            const sceneData = await setupScene('LOW');
            chimneyLight = sceneData.chimneyLight;
            boxGlb = sceneData.boxGlb;
        }


        return nextTick(() => fsm.switchTo('SAPIN'));
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
        updateLights(delta);
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
        updateLights(delta);
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
        updateLights(delta);
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
        updateLights(delta);
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
onBeforeMount(() => {
    initFsm = fsm.state.onEnter();
});

import Stats from 'stats.js';

let lastTime = 0;
onMounted(async () => {
    await initFsm;
    const setupData = await useRenderer(canvas.value);
    camera = setupData.camera;
    scene = setupData.scene;

    const sceneData = await setupScene();
    chimneyLight = sceneData.chimneyLight;
    boxGlb = sceneData.boxGlb;

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
        if (!lastTime)
            lastTime = time;
        const delta = time - lastTime;
        lastTime = time;
        if (fsm.state.frame)
            fsm.state.frame(delta / 1000.0);
        setupData.render();
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    var stats = new Stats();
    stats.showPanel(0)
    document.body.appendChild(stats.dom);

    function animate() {
        stats.end();
        stats.begin();
        requestAnimationFrame( animate );
    }

    stats.begin();
    requestAnimationFrame( animate );

});

watchEffect(() => {
    for (const box of boxes)
        box.children[1].children[0].material.color = new THREE.Color(!hoveredObject.value || hoveredObject.value?.uuid === box.uuid ? '#ffffff' : '#aaaaaa');

})

watch([toRef(walletStore, 'userWalletAddress')], () => {
    if (walletStore.userWalletAddress)
        fsm.switchTo('LOADING');
    else
        fsm.switchTo('CHECK_WALLET');
}, {
    immediate: true,
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

const quality = ref('LOW');

watch(quality, async () => {
    const sceneData = await setupScene(quality.value);
    chimneyLight = sceneData.chimneyLight;
    boxGlb = sceneData.boxGlb;
})

</script>

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        id="unboxGl"
        ref="canvas"
        @click="(event) => fsm.state?.onClick?.(event)"
        @pointermove="(event) => fsm.state?.onPointerMove?.(event)"/>
    <div class="absolute bottom-0 left-0 text-base">
        <FireplaceAudio/>
    </div>
    <div class="absolute bottom-[1rem] left-0 text-base">
        <select v-model="quality">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
        </select>
    </div>
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
    <div
        v-if="step === 'CHECK_WALLET'" class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-base bg-repeat bg-auto alternate-buttons flex-col gap-4"
        :style="{ backgroundImage: `url(${BriqsOverlay})`, backgroundSize: '1000px auto' }">
        <h2>briq unboxing</h2>
        <Btn @click="walletStore.openWalletSelector()">Connect your Wallet</Btn>
        <Btn v-if="APP_ENV === 'dev'" @click="useMockWallet">Dev</Btn>
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
}</style>
