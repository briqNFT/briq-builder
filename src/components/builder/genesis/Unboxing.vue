<script setup lang="ts">
import {
    THREE,
} from '@/three';

import { useBuilder } from '@/builder/BuilderStore';
import { walletStore } from '@/chain/Wallet';

import { reactive, shallowReactive, computed, ref, onMounted, watch, onBeforeMount, toRef, WatchStopHandle, h } from 'vue';
import { setupScene, useRenderer } from './Unboxing';
import { CameraOnlyInput } from '@/builder/inputs/input_states/CameraOnly';
import ButtonVue from '@/components/generic/Button.vue';
import LookAtBoxVue from './Texts/LookAtBox.vue';


//////////////////////////////
//////////////////////////////

const chapters = reactive([] as { active: boolean, component: any }[]);

const addChapter = (component: any) => {
    chapters.push(
        {
            active: true,
            component,
        },
    )
    return chapters[chapters.length - 1];
}


//////////////////////////////
//////////////////////////////

const canvas = ref(null as unknown as HTMLCanvasElement);

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let chimneyLight: THREE.PointLight;
let box: any;

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

//////////////////////////////
//////////////////////////////

let initFsm: Promise<void>;
onBeforeMount(() => {
    initFsm = fsm.state.onEnter();
});

let lastTime = 0;
onMounted(async () => {
    await initFsm;
    const setupData = await useRenderer(canvas.value);
    camera = setupData.camera;
    scene = setupData.scene;
    const sceneData = await setupScene(scene, camera);

    chimneyLight = sceneData.chimneyLight;
    box = sceneData.box;

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
});

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
    const objects = rc.intersectObjects(scene.children, true);
    if (objects.length && objects[0].object.userData.uid === 'toto') {
        let obj = objects[0].object as THREE.Mesh;
        while (obj.parent?.userData.uid === 'toto')
            obj = obj.parent;
        return obj
    } else
        return undefined;
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

type steps = 'CHECK_WALLET' | 'LOADING' | 'SAPIN' | 'CHECK_BOX' | 'UNBOXING' | 'UNBOXED';

interface FsmState {
    onEnter(): Promise<void>;
    onLeave?: (to: string) => Promise<void>;
    frame?: (delta: number) => void;
}

const initialState = new class implements FsmState {
    stopHandle!: WatchStopHandle
    async onEnter() {
        this.stopHandle = watch(toRef(walletStore, 'userWalletAddress'), () => {
            if (walletStore.userWalletAddress)
                return fsm.switchTo('LOADING');
        });
    }
    async onLeave() {
        this.stopHandle();
    }
}

const loadingState = new class implements FsmState {
    async onEnter() {
        await sceneReady;
        return fsm.switchTo('SAPIN');
    }
}

const sapinState = new class implements FsmState {
    async onEnter() {
        canvas.value.addEventListener('click', this.onClick);

        camera.getWorldPosition(lastCamPos.value);
        camera.getWorldQuaternion(lastCamRot.value);
        camInterp.value = 0;
        camera.position.set(-2, 1.8, -2);
        camera.lookAt(new THREE.Vector3(2, 0, 2));
        currentCamPos.value = camera.position.clone();
        camera.getWorldQuaternion(currentCamRot.value);
        this.setCam();
    }

    async onLeave() {
        canvas.value.removeEventListener('click', this.onClick);
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
}

const checkBoxState = new class implements FsmState {
    initialChapter: any;
    async onEnter() {
        canvas.value.addEventListener('click', this.onClick);

        this.initialChapter = addChapter(
            h(LookAtBoxVue, {
                startUnbox: start_unbox,
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
        if (to === 'UNBOXING')
            this.initialChapter.active = false;
        else
            chapters.splice(x => x == this.initialChapter);
        canvas.value.removeEventListener('click', this.onClick);
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
}

const unboxingState = new class implements FsmState {
    async onEnter() {}
    frame(delta: number) {
        updateLights(delta);
    }
}

const unboxedState = new class implements FsmState {
    async onEnter() {}
    frame(delta: number) {
        updateLights(delta);
        selectedObject.value?.userData.mixer.update(delta);
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

    const message = {
        domain: {
            name: 'briq',
            chainId: false ? 1 : 3,
            version: 1,
        },
        types: {
            StarkNetDomain: [
                { name: 'name', type: 'felt' },
                { name: 'chainId', type: 'felt' },
                { name: 'version', type: 'felt' },
            ],
            Message: [{ name: 'message', type: 'felt' }],
        },
        primaryType: 'Message',
        message: {
            message: 'mint_set',
        },
    };

    try {
        await walletStore.signer.signMessage(message)
    } catch(_) {}

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
</script>

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

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        id="unboxGl"
        ref="canvas"
        @click="onClick"/>
    <div class="absolute bottom-0 left-0">
        <FireplaceAudio/>
    </div>
    <div
        id="unboxing"
        class="absolute top-0 right-0 xl:w-[30%] w-[400px] bg-black bg-opacity-40 h-screen overflow-auto snap-y transition-all scroll-smooth"
        @click.stop="">
        <div class="snap-end text-lg pb-[15rem] px-8 py-4">
            <h2 class="text-center my-8">briq unboxing</h2>
            <p>
                Today is Christmas, 1995. <br>
                Your gifts have been left by the tree, and are waiting for you.
            </p>
            <p class="my-2">
                It is now the hour, and by the fireplace you may open them.<br>
                Let your imagination roam free.
            </p>
            <TransitionGroup name="xfade">
                <div v-for="chapter, i of chapters" :key="i">
                    <component :is="chapter.component" :active="chapter.active"/>
                </div>
            </TransitionGroup>
            <Transition name="xfade">
                <div v-if="!!selectedObject && step.includes('UNBOX')">
                    <hr>
                    <p>You recite the ancient incantations in an untold language.</p>
                    <p>StarkNet address: {{ walletStore.userWalletAddress }}</p>
                    <p>Ethereum address: {{ 'TODO' }}</p>
                    <p class="flex justify-center gap-2 my-4 text-md">
                        <Btn :disabled="step === 'UNBOXED'" v-if="!walletStore.userWalletAddress" @click="walletStore.openWalletSelector()">Connect to StarkNet</Btn>
                        <Btn :disabled="step === 'UNBOXED'" v-else>StarkNet Wallet</Btn>
                        <Btn :disabled="step === 'UNBOXED'">Connect to Ethereum</Btn>
                    </p>
                </div>
            </Transition>
            <Transition name="xfade">
                <div v-if="!!selectedObject && step.includes('UNBOX') && walletStore.userWalletAddress">
                    <hr>
                    <p>The box is in your hands. Everything is ready.</p>
                    <p class="flex justify-center gap-2 my-4 text-md">
                        <Btn @click="unbox" :disabled="step === 'UNBOXED'">Open the box</Btn>
                    </p>
                </div>
            </Transition>
            <Transition name="xfade">
                <div v-if="step === 'UNBOXED'">
                    <hr>
                    <p class="flex justify-center gap-2 my-4 text-md">
                        <Btn @click="goToBuilder">Start building</Btn>
                    </p>
                </div>
            </Transition>
        </div>
    </div>
    <div v-if="step === 'CHECK_WALLET'" class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-base alternate-buttons flex-col gap-4">
        <h2>briq unboxing</h2>
        <Btn @click="walletStore.openWalletSelector()">Connect your Wallet</Btn>
    </div>
</template>
