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

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let orbitControls;

let glbItem;
let previousItem;

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
const material = genMaterial('1.0');
material.vertexColors = true;
material.transparent = true;
material.depthTest = true;
material.depthWrite = false;

const otherMaterial = genMaterial('0.3');
otherMaterial.vertexColors = true;
otherMaterial.transparent = true;
otherMaterial.depthTest = true;
otherMaterial.depthWrite = false;

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
    const resolution = 2;

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
    if (glbItem)
        return;

    const defaultLoader = new THREE.TextureLoader();

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

async function loadGlbItems(glb_name: string, i: number) {
    const previousLink = backendManager.getRoute(`box/step_glb/${getCurrentNetwork()}/${glb_name}/${i - 1}.glb`);
    const link = backendManager.getRoute(`box/step_glb_level/${getCurrentNetwork()}/${glb_name}/${i}.glb`);

    const itemPromise = new Promise<THREE.Group>((resolve, reject) => {
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

    let previousItemPromise;
    if (i > 0)
        previousItemPromise = new Promise<THREE.Group>((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                previousLink,
                (gltf: any) => {
                    resolve(gltf.scene.children.slice()[0]);
                },
                () => {},
                (error: any) => reject(error),
            );
        });

    glbItem = await itemPromise;
    const borders = glbItem.clone();
    for (const item of borders.children)
        item.material = material
    glbItem.add(borders);

    if (!userSet.value) {
        const bb = new THREE.Box3();
        for (const item of glbItem.children)
            if (item.geometry)
                bb.union(item.geometry.boundingBox);
        const center = [0, 1, 2].map(i => (bb.max.getComponent(i) + bb.min.getComponent(i))/2.0);
        orbitControls.target.set(...center);
        const radius = Math.max(4, bb.getBoundingSphere(new THREE.Sphere()).radius);
        camera.position.set(...center.map((x, i) => x + (new THREE.Vector3(1, 1, -1)).multiplyScalar(3 * radius).getComponent(i)));
    }

    if (i > 0) {
        const previousItem = await previousItemPromise;
        const previousBorders = previousItem.clone();
        for (const item of previousBorders.children)
            item.material = otherMaterial;
        for (const item of previousItem.children) {
            item.material.fog = true;
            item.material.color = (item.material.color as THREE.Color).lerp(new THREE.Color(0xffffff), 0.6);
        }

        previousItem.add(previousBorders);
        glbItem.add(previousItem);
    }
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
    <canvas class=" w-full h-full" ref="canvasRef"/>
</template>