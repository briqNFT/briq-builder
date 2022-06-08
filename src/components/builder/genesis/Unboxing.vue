<script setup lang="ts">
import { useBuilder } from '@/builder/BuilderStore';
import { walletStore } from '@/chain/Wallet';
import { pushModal } from '@/components/Modals.vue';
import { store } from '@/store/Store';
import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SAOPass,
    CopyShader,
    OrbitControls,
} from '@/three';

import { ref, onMounted, watch, toRef } from 'vue';

const canvas = ref(null);

function resizeRendererToDisplaySize(renderer, composer, camera) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        // FXAA
        composer.passes[1].uniforms['resolution'].value.x = 1 / width;
        composer.passes[1].uniforms['resolution'].value.y = 1 / height;

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function recreateRenderer(canvas, scene, camera) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, logarithmicDepthBuffer: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0xF00000, 0);

    const composer = new EffectComposer(renderer);
    {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        var copyPass = new ShaderPass(FXAAShader);
        const size = new THREE.Vector2();
        renderer.getSize(size);
        copyPass.uniforms['resolution'].value.x = 1 / size.x;
        copyPass.uniforms['resolution'].value.y = 1 / size.y;
        composer.addPass(copyPass);
    }
    if (true/*builderSettings.useSAO*/) {
        const saoPass = new SAOPass(scene, camera, true, true);
        saoPass.params = {
            output: 0,
            saoBias: 1,
            saoIntensity: 0.1,
            saoScale: 200,
            saoKernelRadius: 40,
            saoMinResolution: 0,
            saoBlur: true,
            saoBlurRadius: 8,
            saoBlurStdDev: 4,
            saoBlurDepthCutoff: 0.01,
        };
        composer.addPass(saoPass);
    }
    /* ThreeJS auto-renders the final pass to the screen directly, which breaks my scene layering. */
    /* Instead, add a manual 'write to screen' pass */
    {
        var copyPass = new ShaderPass(CopyShader);
        composer.addPass(copyPass);
    }
    //resizeRendererToDisplaySize(renderer, composer, camera);
    return [renderer, composer];
}

function _render(renderer, composer, camera) {
    resizeRendererToDisplaySize(renderer, composer, camera);
    composer.render();
}

const renderFunc = ref(null);
const render = () => renderFunc.value();

import { GLTFLoader } from '@/three';

import HomeScene from '@/assets/genesis/briqs_box_xmas.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

const cameraRef = ref(undefined as THREE.Camera | undefined);

let boxOpenAnim: any;

let chimneyLight;

async function setup(canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    const scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2;
    const near = 0.01;
    const far = 20;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraRef.value = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new THREE.Vector3(2, 0, 2);

    camera.position.set(-2, 1.8, -2);
    camera.lookAt(new THREE.Vector3(2, 0, 2));
    scene.add(camera);

    scene.background = new THREE.Color('#230033');
    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF'), 0.3))
    const light = new THREE.PointLight(new THREE.Color('#FFDDDD'), 1.2, 10.0);
    light.position.set(0.5, 2.25, -1);
    light.shadow.bias = -0.01;
    light.shadow.radius = 10;
    light.shadow.mapSize = new THREE.Vector2(1024, 1024);
    light.castShadow = true;
    scene.add(light)

    const meshes = await new Promise((resolve: (_: THREE.Mesh[]) => void, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            HomeScene,
            (gltf: any) => {
                resolve(gltf.scene.children.slice(1));
            },
            () => {},
            (error: any) => reject(error),
        );
    })
    const obj = new THREE.Group();
    for(const mesh of meshes) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        for (const child of mesh.children) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        obj.add(mesh);
    }
    scene.add(obj);
    obj.rotateY(Math.PI);
    obj.translateY(-2.05);
    obj.translateZ(9);

    {
        const light2 = new THREE.PointLight(new THREE.Color('#FFAA00'), 1.5, 6.0);
        light2.position.set(2.6, 0.4, 0.5);
        light2.shadow.bias = -0.01;
        light2.shadow.radius = 20;
        light2.shadow.mapSize = new THREE.Vector2(512, 512);
        light2.castShadow = true;
        scene.add(light2);
        chimneyLight = light2;
    }

    const boxGlb = await new Promise<{ anim: THREE.AnimationAction, box: THREE.Object3D }>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            BriqBox,
            (gltf: any) => {
                resolve({
                    anim: gltf.animations[0],
                    box: gltf.scene.children.slice()[0],
                });
            },
            () => {},
            (error: any) => reject(error),
        );
    })
    const box = boxGlb.box;

    boxOpenAnim = boxGlb.anim;
    const mixer = new THREE.AnimationMixer(box);
    const anim = mixer.clipAction(boxGlb.anim)
    anim.timeScale = -2;
    anim.paused = false;
    anim.setLoop(THREE.LoopRepeat, 1);
    anim.play();
    mixer.setTime(0.001);

    box.userData.mixer = mixer;
    box.position.set(1.2, 0.07, 1.2);
    box.rotateY(Math.PI);
    box.userData.uid = 'toto';
    box.children[1].userData.uid = box.userData.uid;
    box.children[1].children.forEach(x => {
        x.userData.uid = box.userData.uid;
        x.castShadow = true;
        x.receiveShadow = true;
    });

    const lightMapLoader = new THREE.TextureLoader();
    const texture = lightMapLoader.load('/spaceman/box_texture.png');
    texture.encoding = THREE.sRGBEncoding;
    texture.flipY = false;


    box.children[1].children[0].material.color = new THREE.Color('#ffffff');
    box.children[1].children[1].material.color = new THREE.Color('#ffffff');

    (box.children[1].children[0].material.map as THREE.Texture) = texture;
    (box.children[1].children[0].material as THREE.MeshStandardMaterial).normalMap.encoding = THREE.sRGBEncoding;
    (box.children[1].children[0].material as THREE.MeshStandardMaterial).normalMap.needsUpdate = true;

    scene.add(box);
    console.log(scene);

    const [renderer, composer] = recreateRenderer(canvas, scene, camera);
    renderFunc.value = () => _render(renderer, composer, camera);
}

onMounted(async () => {
    await setup(canvas.value);
    const toto = () => {
        render();
        requestAnimationFrame(toto);
    }
    requestAnimationFrame(toto);
});

const selectedObject = ref(undefined as THREE.Mesh | undefined);
watch(selectedObject, (newV, oldV) => {
    if (oldV)
        oldV.children[1].children[0].material.color = new THREE.Color('#ffffff');
    if (newV)
        newV.children[1].children[0].material.color = new THREE.Color('#FF0022');
})

const onClick = (event: PointerEvent) => {
    const rc = new THREE.Raycaster();
    const cv = canvas.value as unknown as HTMLCanvasElement;
    rc.setFromCamera({ x: event.clientX / cv.clientWidth * 2 - 1.0, y: event.clientY / cv.clientHeight * - 2 + 1.0 }, cameraRef.value!);
    console.log(cameraRef.value!.parent);
    const objects = rc.intersectObjects(cameraRef.value!.parent.children, true);
    if (objects.length && objects[0].object.userData.uid === 'toto') {
        let obj = objects[0].object as THREE.Mesh;
        while (obj.parent?.userData.uid === 'toto')
            obj = obj.parent;
        selectedObject.value = obj;
    } else
        selectedObject.value = undefined;
}

import UnboxModal from './UnboxModal.vue';
import Modals from '../../Modals.vue';
import { useRouter } from 'vue-router';

const router = useRouter()

const step = ref('CHECK_WALLET' as 'CHECK_WALLET' | 'SAPIN' | 'CHECK_BOX' | 'UNBOXING');

watch(toRef(walletStore, 'userWalletAddress'), () => {
    if (walletStore.userWalletAddress)
        step.value = 'SAPIN';
}, {
    immediate: true,
})

const unbox = async () => {
    if (await pushModal(UnboxModal)) {
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
        step.value = 'UNBOXING';
    }
}

const goToBuilder = () => {
    router.push({ name: 'Builder' });
}

let lastTime;

function frame(time) {
    requestAnimationFrame(frame);
    if (!lastTime) {
        lastTime = time;
        return;
    }
    const delta = time - lastTime;
    lastTime = time;

    if (chimneyLight) {
        const intensity = Math.random() > 0.8 ? 0.2 : 0.01;

        (chimneyLight as THREE.PointLight).position.set(
            2.5 + (Math.random() * intensity - intensity/2) * 0.0,
            0.5 + (Math.random() * intensity - intensity/2) * 0.1,
            0.6 + (Math.random() * intensity - intensity/2) * 0.1,
        );
        (chimneyLight as THREE.PointLight).intensity = Math.random() * 0.3 + 0.85;
    }


    if (step.value === 'UNBOXING')
        selectedObject.value?.userData.mixer.update(delta / 1000.0);
}
requestAnimationFrame(frame);
</script>

<template>
    <div v-if="step === 'CHECK_WALLET'" class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-base alternate-buttons flex-col gap-4">
        <h2>briq unboxing</h2>
        <Btn @click="walletStore.openWalletSelector()">Connect your Wallet</Btn>
    </div>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        id="unboxGl"
        ref="canvas"
        @click="onClick"/>
    <div class="relative" v-if="step !== 'UNBOXING'">
        <p>Here be the boxes</p>
        <div>Currently selected: {{ selectedObject?.userData?.uid ?? 'No box' }}</div>
        <Btn @click="unbox" :disabled="!selectedObject">Unbox</Btn>
    </div>
    <div class="relative" v-else-if="step === 'UNBOXING'">
        <Btn @click="goToBuilder">Go to builder</Btn>
    </div>
    <Modals/>
</template>
