<script setup lang="ts">
import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';
import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    SSAOPass,
    GammaCorrectionShader,
    OrbitControls,
    SMAAPass,
} from '@/three';

import { GLTFLoader } from '@/three';

import { onMounted, ref, toRef, watch } from 'vue';

const userSet = ref(false);

const resolution = 1.0;

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let orbitControls: unknown;
let glbItem: THREE.Group;

let glbItemPerNamePerStep = {} as Record<string, Record<number, THREE.Group>>;
const genMaterial = (alpha: string) => new THREE.ShaderMaterial( {
    vertexShader: `
        varying vec3 pos;
        varying vec3 vColor;
        void main() {
            vColor = color;
            pos = position;
            vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        `,
    fragmentShader:
        `
        varying vec3 pos;
        varying vec3 vColor;
        void main() {
            float xb = abs(0.5f - mod(pos.x - 0.5, 1.0f));
            float yb = abs(0.5f - mod(pos.y - 0.5, 1.0f));
            float zb = abs(0.5f - mod(pos.z - 0.5, 1.0f));
            float threshold = 0.48;
            if (xb > threshold && yb > threshold)
                gl_FragColor = vec4(vec3(0, 0, 0), ${alpha}f);
            else if (zb > threshold && yb > threshold)
                gl_FragColor = vec4(vec3(0, 0, 0), ${alpha}f);
            else if (zb > threshold && xb > threshold)
                gl_FragColor = vec4(vec3(0, 0, 0), ${alpha}f);
            else
                gl_FragColor = vec4(vec3(0, 0, 0), 0.f);
            //gl_FragColor = vec4(1.0, 0.0, 0.0, xb + yb + zb);
        }
        `,
});
const borderMaterial = genMaterial('1.0');
borderMaterial.vertexColors = true;
borderMaterial.transparent = true;
borderMaterial.depthTest = true;
borderMaterial.depthWrite = false;

const borderLightMaterial = genMaterial('0.3');
borderLightMaterial.vertexColors = true;
borderLightMaterial.transparent = true;
borderLightMaterial.depthTest = true;
borderLightMaterial.depthWrite = false;

function recreateRenderer() {
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xFF0000, 0);
    // Somehow breaks animations.
    //renderer.info.autoReset = false;

    const parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
    };
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, parameters);
    renderTarget.texture.encoding = THREE.sRGBEncoding;
    composer = new EffectComposer(renderer, renderTarget);

    {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const size = new THREE.Vector2();
        renderer.getSize(size);

        const aoPass = new SSAOPass(scene, camera, size.x, size.y);
        aoPass.output = SSAOPass.OUTPUT.Default;
        aoPass.kernelRadius = 0.02;
        aoPass.minDistance = 0.001;
        aoPass.maxDistance = 0.02;
        composer.addPass(aoPass);

        const copyPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(copyPass);

        const smaaPass = new SMAAPass(200, 200);
        composer.addPass(smaaPass);

    }
    return [renderer, composer];
}

function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.parentElement.clientWidth * resolution;
    const height = canvas.parentElement.clientHeight * resolution;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        // SSAO
        composer.passes[1].setSize(width, height);

        // SMAA
        composer.passes[3].setSize(width, height);

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function render() {
    if (!composer)
        return;
    resizeRendererToDisplaySize();
    composer.render();
    //renderer.info.reset();
}

async function useRenderer(canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    // Have to recreate renderer, to update the canvas.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });

    // We only need the rest once.
    if (camera)
        return;

    /* Create the camera early, because it's needed for the post-processor. */
    const fov = 20;
    const aspect = 2;
    const near = 0.5;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(20, 20, -20);

    orbitControls = new OrbitControls(camera, canvas);
    orbitControls.enableDamping = true;
    orbitControls.target = new THREE.Vector3(0, 0, 0);

    orbitControls.addEventListener('start', () => userSet.value = true)
    orbitControls.enabled = true;
}

async function loadGlbItem(glb_name: string, i: number, path: string) {
    const link = backendManager.getRoute(`box/${path}/${getCurrentNetwork()}/${glb_name}/${i}.glb`);
    return new Promise<THREE.Group>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            link,
            (gltf: any) => {
                resolve(gltf.scene.children.slice()[0]);
            },
            () => {},
            (error: any) => reject(error),
        );
    });
}

async function loadGlbItems(glb_name: string, i: number) {
    if (scene && glbItem)
        scene.remove(glbItem);

    if (!glbItemPerNamePerStep?.[glb_name]?.[i]) {
        const item = await loadGlbItem(glb_name, i, 'step_glb_level');
        const borders = item.clone(true);
        for (const item of borders.children)
            item.material = borderMaterial;
        item.add(borders);

        if (i > 0) {
            const previousItem = await loadGlbItem(glb_name, i - 1, 'step_glb');
            for (const item of previousItem.children) {
                item.material.fog = true;
                item.material.color = (item.material.color as THREE.Color).lerp(new THREE.Color(0xffffff), 0.6);
            }
            const previousBorders = previousItem.clone(true);
            for (const item of previousBorders.children)
                item.material = borderLightMaterial;
            previousItem.add(previousBorders);
            item.add(previousItem);
        }
        if (!glbItemPerNamePerStep[glb_name])
            glbItemPerNamePerStep[glb_name] = {};
        glbItemPerNamePerStep[glb_name][i] = item;
    }

    glbItem = glbItemPerNamePerStep[glb_name][i];

    if (!userSet.value)
        resetCamera();
}

async function setupScene() {
    if (scene)
        scene.clear();

    scene = new THREE.Scene();

    recreateRenderer();

    renderer.shadowMap.type = THREE.BasicShadowMap;

    composer.passes[1].enabled = true;
    composer.passes[3].enabled = true;

    if (glbItem)
        scene.add(glbItem);
    scene.add(camera);

    const ambient = new THREE.AmbientLight(new THREE.Color(0xFFFFFF), 0.6);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(new THREE.Color(0xFFFFFF), 0.6);
    light.position.set(1, 1, 1);
    scene.add(light);
}

const frame = () => {
    render();
    orbitControls.update();
    requestAnimationFrame(frame);
}


const resetCamera = () => {
    const bb = new THREE.Box3();
    for (const item of glbItem.children)
        if (item.geometry)
            bb.union(item.geometry.boundingBox);
    const center = [0, 1, 2].map(i => (bb.max.getComponent(i) + bb.min.getComponent(i))/2.0);
    orbitControls.target.set(...center);
    const radius = Math.max(4, bb.getBoundingSphere(new THREE.Sphere()).radius);
    camera.position.set(...center.map((x, i) => x + (new THREE.Vector3(1, 1, -1)).multiplyScalar(3 * radius).getComponent(i)));
    userSet.value = false;
};

const canvasRef = ref(null as unknown as HTMLCanvasElement);

onMounted(() => {
    useRenderer(canvasRef.value).then(async () => {
        await setupScene();
        requestAnimationFrame(frame);
    })
});

const props = defineProps<{
    glb_name: string,
    i: number
}>();

watch([toRef(props, 'i'), toRef(props, 'glb_name')], async () => {
    await loadGlbItems(props.glb_name, props.i);
    await setupScene();
}, {
    immediate: true,
});
</script>


<template>
    <Btn @click="resetCamera" :disabled="!userSet" class="w-10 h-10 absolute m-1 top-0 right-0" secondary><i class="text-lg fas fa-expand"/></Btn>
    <div class="flex justify-center items-center cursor-move w-full h-full">
        <canvas class="w-full h-full" ref="canvasRef"/>
    </div>
</template>