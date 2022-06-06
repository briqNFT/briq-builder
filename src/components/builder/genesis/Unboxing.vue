<script setup lang="ts">
import { pushModal } from '@/components/Modals.vue';
import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SAOPass,
    CopyShader
} from '@/three';

import { ref, onMounted, watch } from 'vue';

/*import { builderInputFsm } from '@/builder/inputs/BuilderInput';

const onPointerMove = async (event: PointerEvent) => { await builderInputFsm.onPointerMove(event); }
const onPointerDown = async (event: PointerEvent) => { await builderInputFsm.onPointerDown(event); }
const onPointerUp = async (event: PointerEvent) => { await builderInputFsm.onPointerUp(event); }
*/
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
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

import HomeScene from '@/assets/genesis/home_scene.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

const cameraRef = ref(undefined as THREE.Camera | undefined);

async function setup(canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    const scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2;
    const near = 0.01;
    const far = 20;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraRef.value = camera;

    camera.position.set(-2, 1.8, -2);
    camera.lookAt(new THREE.Vector3(2, 0, 2));
    scene.add(camera);

    scene.background = new THREE.Color('#230033');
    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF'), 0.3))
    const light = new THREE.PointLight(new THREE.Color('#FFDDDD'), 1.2, 10.0);
    light.position.set(0, 2.2, -2);
    light.castShadow = true;
    scene.add(light)

    const meshes = await new Promise((resolve: (_: THREE.Mesh[]) => void, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            HomeScene,
            (gltf: any) => {
                resolve(gltf.scene.children.slice());
            },
            () => {},
            (error: any) => reject(error),
        );
    })
    meshes[0].receiveShadow = true;
    for (let mesh of meshes[1].children) {
        mesh.castShadow = true;
        mesh.receiveShadow = false;
    }
    /*
    meshes[0].material = new THREE.MeshStandardMaterial({
        color: "#404040",
    })
    meshes[0].material.side = THREE.DoubleSide;
    meshes[1].material = new THREE.MeshStandardMaterial({
        color: "#22AA99"
    })
    meshes[0].receiveShadow = true;
    meshes[1].receiveShadow = true;
    meshes[1].castShadow = true;
    */

    for(const mesh of meshes)
        scene.add(mesh);

    const boxGlb = await new Promise((resolve: (_: THREE.Mesh[]) => void, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            BriqBox,
            (gltf: any) => {
                resolve(gltf.scene.children.slice());
            },
            () => {},
            (error: any) => reject(error),
        );
    })
    const box = boxGlb[0];
    box.position.set(1.2, 0.1, 1.2);
    box.userData.uid = "toto";
    box.children[4].material = new THREE.MeshStandardMaterial({
        color: "#aa8800"
    });
    box.children[4].children.forEach(x => {
        x.material = box.children[4].material
        x.userData.uid = box.userData.uid;
    });
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
        oldV.material.color = new THREE.Color('#aa8800');
    if (newV)
        newV.material.color = new THREE.Color('#FF0022');
})

const onClick = (event: PointerEvent) => {
    const rc = new THREE.Raycaster();
    const cv = canvas.value as unknown as HTMLCanvasElement;
    rc.setFromCamera({ x: event.clientX / cv.clientWidth * 2 - 1.0, y: event.clientY / cv.clientHeight * - 2 + 1.0 }, cameraRef.value!);
    console.log(cameraRef.value!.parent);
    const objects = rc.intersectObjects(cameraRef.value!.parent.children, true);
    if (objects.length && objects[0].object.userData.uid === 'toto')
        selectedObject.value = objects[0].object as THREE.Mesh;
    else
        selectedObject.value = undefined;
}

import UnboxModal from './UnboxModal.vue';
import Modals from '../../Modals.vue';
import { useRouter } from 'vue-router';

const router = useRouter()

const unbox = async () => {
    if (await pushModal(UnboxModal))
    {
        window.localStorage.setItem("briq_current_booklet", "spaceman");
        router.push({ name: 'Builder' });
    }
}
</script>

<template>
    <canvas
        class="absolute top-0 left-0 w-screen h-screen"
        id="unboxGl"
        ref="canvas"
        @click="onClick"/>
    <div class="relative">
        <p>Here be the boxes</p>
        <div>Currently selected: {{ selectedObject?.userData?.uid ?? 'No box' }}</div>
        <Btn @click="unbox" :disabled="!selectedObject">Unbox</Btn>
    </div>
    <Modals></Modals>
</template>
