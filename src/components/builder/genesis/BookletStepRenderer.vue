<script setup lang="ts">
import { backendManager } from '@/Backend';
import { ShaderGrid } from '@/builder/graphics/ShaderGrid';
import { inputStore } from '@/builder/inputs/InputStore';
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

import Pipette from '@/assets/eye-dropper-solid.svg?url';
import CrossHairs from '@/assets/crosshairs-light.svg';


import { GLTFLoader } from '@/three';

import { onMounted, ref, toRef, watch, watchEffect } from 'vue';

const userSet = ref(false);

const resolution = 1.0;

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let orbitControls: unknown;
let glbItem: THREE.Group;

let glbItemPerNamePerStep = {} as Record<string, Record<number, THREE.Group>>;
const genMaterial = (darkness: string) => new THREE.ShaderMaterial( {
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
                gl_FragColor = vec4(vec3(${darkness}), 1.0f);
            else if (zb > threshold && yb > threshold)
                gl_FragColor = vec4(vec3(${darkness}), 1.0f);
            else if (zb > threshold && xb > threshold)
                gl_FragColor = vec4(vec3(${darkness}), 1.0f);
            else
                gl_FragColor = vec4(vec3(0, 0, 0), 0.f);
            //gl_FragColor = vec4(1.0, 0.0, 0.0, xb + yb + zb);
        }
        `,
});
const borderMaterial = genMaterial('0.0');
borderMaterial.vertexColors = true;
borderMaterial.transparent = true;
borderMaterial.depthTest = true;
borderMaterial.depthWrite = false;

const borderLightMaterial = genMaterial('0.3');
borderLightMaterial.vertexColors = true;
borderLightMaterial.transparent = true;
borderLightMaterial.depthTest = true;
borderLightMaterial.depthWrite = false;

const iridescentMaterialGen = (alpha: string) => new THREE.ShaderMaterial( {
    uniforms: { time: { value: 0 } },
    vertexShader: `
        varying vec3 norm;
        varying vec3 pos;
        void main() {
            norm = abs(normal) * 3.0;
            norm = (viewMatrix * vec4(pos, 1.0)).xyz;
            pos = position;
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        `,
    fragmentShader:
        `varying vec3 norm;
        varying vec3 pos;
        uniform float time;
        void main() {
            float xx = mod(pos.x + 0.5, 2.0);
            float yy = mod(pos.y + 0.5, 2.0);
            float zz = mod(pos.z + 0.5, 2.0);
            xx = abs(1.0 - xx);
            yy = abs(1.0 - yy);
            zz = abs(1.0 - zz);

            vec3 iri = vec3(xx, yy, zz);
            float xb = mod(pos.x + time, 2.0) * 0.9 + 0.1;
            float yb = mod(pos.y + time, 2.0) * 0.9 + 0.1;
            float zb = mod(pos.z + time, 2.0) * 0.9 + 0.1;
            xb = abs(0.5f - mod(pos.x - 0.5, 1.0f));
            yb = abs(0.5f - mod(pos.y - 0.5, 1.0f));
            zb = abs(0.5f - mod(pos.z - 0.5, 1.0f));
            float threshold = 0.47;
            if (xb > threshold && yb > threshold)
                gl_FragColor = vec4(mix(vec3(1.0), iri, ${alpha}), 1.0f);
            else if (zb > threshold && yb > threshold)
                gl_FragColor = vec4(mix(vec3(1.0), iri, ${alpha}), 1.0f);
            else if (zb > threshold && xb > threshold)
                gl_FragColor = vec4(mix(vec3(1.0), iri, ${alpha}), 1.0f);
            else
                gl_FragColor = vec4(vec3(0, 0, 0), 0.f);
        }
        `,
});

const iridescentMaterial = iridescentMaterialGen('1.0');
iridescentMaterial.transparent = true;
iridescentMaterial.name = 'any_color_any_material';

const iridescentMaterialLight = iridescentMaterialGen('0.3');
iridescentMaterialLight.transparent = true;
iridescentMaterialLight.name = 'any_color_any_material';

function recreateRenderer() {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xFF0000, 0);
    // Somehow breaks animations.
    //renderer.info.autoReset = false;

    const parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
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

function render(t: number) {
    if (!composer)
        return;
    /*
    if (iridescentMaterial) {
        iridescentMaterial.uniforms.time.value = (t / 1000.0);
        iridescentMaterialLight.uniforms.time.value = (t / 1000.0);
    }
    */
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
    const near = 1.0;
    const far = 750;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-20, 20, 20);
    camera.layers.enableAll();

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
        borders.traverse(it => {
            if (!it.material)
                return;
            it.layers.set(1);
            if (it?.material?.name === '0x1_#1e1e1e')
                it.material = borderLightMaterial;
            else
                it.material = borderMaterial;
        });
        borders.layers.set(1);
        const addIridescence = [] as THREE.Object3D[];
        item.traverse(it => {
            if (!it.material)
                return;
            if (it.material.name.search('any') !== -1)
                addIridescence.push(it);

        });
        for (const it of addIridescence) {
            const irid = it.clone();
            irid.material = iridescentMaterial.clone();
            irid.geometry.computeVertexNormals();
            irid.material.userData.name = it.material.name.split('_')[2];
            it.add(irid);
        }

        item.add(borders);
        if (i > 0) {
            const previousItem = await loadGlbItem(glb_name, i - 1, 'step_glb');

            const previousBorders = previousItem.clone(true);
            previousBorders.traverse(item => {
                item.material = borderLightMaterial;
                item.layers.set(1);
            });
            previousBorders.layers.set(1);
            const addIridescence = [] as THREE.Object3D[];
            previousItem.traverse(item => {
                if (!item.material)
                    return;
                if (item.material.name.search('any') !== -1)
                    addIridescence.push(item);
                item.layers.set(1);
                item.material.fog = true;
                item.material.color = (item.material.color as THREE.Color).lerp(new THREE.Color(0xffffff), 0.25);
            });
            for (const it of addIridescence) {
                const border = it.clone();
                border.material = iridescentMaterialLight;
                border.geometry.computeVertexNormals();
                it.add(border);
            }
            previousItem.layers.set(1);

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

    /*
    const grid = (new ShaderGrid().generate()).place(-50, -0, -50, 100, 100);
    grid.grid.translateX(-0.5);
    grid.grid.translateY(-0.5);
    grid.grid.translateZ(-0.5);
    grid.grid.material.uniforms.color.value = new THREE.Vector3(0.6, 0.6, 0.6);
    scene.add(grid.grid);*/

    if (glbItem)
        scene.add(glbItem);

    scene.add(camera);

    const ambient = new THREE.AmbientLight(new THREE.Color(0xFFFFFF), 0.6);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(new THREE.Color(0xFFFFFF), 0.6);
    light.position.set(-1, 1, -1);
    scene.add(light);
}

const frame = (t: number) => {
    render(t);
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
    camera.position.set(...center.map((x, i) => x + (new THREE.Vector3(-1, 1, 1)).multiplyScalar(3 * radius).getComponent(i)));
    userSet.value = false;
};

const hoverColor = ref(undefined as undefined | THREE.Material);

const sampleColor = (event: MouseEvent) => {
    const x = event.offsetX / canvasRef.value.clientWidth * 2 - 1;
    const y = -((event.offsetY / canvasRef.value.clientHeight) * 2 - 1);
    const rc = new THREE.Raycaster();
    rc.layers.set(0);
    rc.setFromCamera({ x, y }, camera);
    const obj = rc.intersectObject(glbItem, true);
    if (obj.length >= 2 && obj[1].distance - obj[0].distance < 0.01 && obj[1].object?.material?.name === 'any_color_any_material')
        obj[0] = obj[1];
    if (obj?.[0]?.object?.material)
        hoverColor.value = obj[0].object.material;
    else
        hoverColor.value = undefined;
}

let mx: number, my: number;
const startSelectHoveredColor = (event: MouseEvent) => {
    mx = event.clientX;
    my = event.clientY;
}

const selectHoveredColor = (event: MouseEvent) => {
    if (!hoverColor.value)
        return;
    if (Math.abs(event.clientX - mx) > 3 || Math.abs(event.clientY - my) > 3)
        return;
    if (hoverColor.value.name === 'any_color_any_material')
        inputStore.currentColor = hoverColor.value.userData.name
    else
        inputStore.currentColor = hoverColor.value.name.split('_')[1];
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

const canvasObj = ref(null as unknown as HTMLDivElement);

watchEffect(() => {
    if (!canvasObj.value)
        return;
    if(!hoverColor.value)
        canvasObj.value.style.cursor = 'move';
    else
        canvasObj.value.style.cursor = `url(${Pipette}) 0 16, move`;
})
</script>

<style scoped>
.rainbow {
    background: linear-gradient(
        140deg,
        rgba(255, 0, 0, 1) 5%,
        rgba(255, 154, 0, 1) 14%,
        rgba(208, 222, 33, 1) 23%,
        rgba(79, 220, 74, 1) 32%,
        rgba(63, 218, 216, 1) 41%,
        rgba(47, 201, 226, 1) 50%,
        rgba(28, 127, 238, 1) 59%,
        rgba(95, 21, 242, 1) 68%,
        rgba(186, 12, 248, 1) 77%,
        rgba(251, 7, 217, 1) 88%,
        rgba(255, 0, 0, 1) 95%
    );
}
.overlay {
    @apply bg-grad-lightest bg-opacity-60 rounded-sm backdrop-blur-sm;
}
</style>

<template>
    <div ref="canvasObj" class="flex justify-center items-center w-full h-full">
        <canvas class="w-full h-full" ref="canvasRef" @mousemove="sampleColor" @mousedown="startSelectHoveredColor" @mouseup="selectHoveredColor"/>
    </div>
    <Btn v-if="userSet" @click="resetCamera" no-style class="w-10 h-10 absolute m-1 top-0 right-0 overlay fill-text-on-background hover:fill-primary p-3"><CrossHairs/></Btn>
    <p v-if="hoverColor" class="absolute pointer-events-none top-0 left-0 ml-1 mt-1 p-3 min-w-[7rem] flex items-center gap-1 overlay">
        <template v-if="hoverColor.name === 'any_color_any_material'">
            <span class="w-4 h-4 rounded-sm rainbow mr-1.5"/> Any color you like
        </template>
        <template v-else>
            <span class="w-4 h-4 rounded-sm  mr-1.5" :style="{ backgroundColor: hoverColor.name.split('_')[1] }"/>{{ hoverColor.name.split('_')[1] }}
        </template>
    </p>
</template>