import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SSAOPass,
    GammaCorrectionShader,
    OrbitControls,
    SMAAPass,
} from '@/three';

import { GLTFLoader } from '@/three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

import EnvMapImg from '@/assets/genesis/WhiteRoom.png';
import EnvMapImg2 from '@/assets/industrial_sunset_02_puresky_1k.exr';
import { backendManager } from '@/Backend';
import { APP_ENV } from '@/Meta';

let envMapTexture: THREE.Texture;

export enum SceneQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA,
}

let canvas: HTMLCanvasElement;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;

let initialised = false;

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;
    initialised = true;

    canvas = _canvas;

    if (renderer)
        renderer.dispose();

    // Recreate the renderer, because the canvas may need updating.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Conceptually, we don't really need to reload what's below, but it leads to a blank scene.
    // I guess the GLB loader keeps a reference to the renderer somehow.
    const defaultLoader = new THREE.TextureLoader();

    let envMapRawTexture: THREE.Texture;
    /*const envMapPromise = new Promise<THREE.Texture>(resolve => defaultLoader.load(EnvMapImg, (tex) => {
        envMapRawTexture = tex;
        resolve(envMapRawTexture);
    }));*/
    const envMapPromise = new Promise<THREE.Texture>(resolve => new EXRLoader().load(EnvMapImg2, function ( texture, textureData ) {
        resolve(texture);
    }));

    /* Create these early, they're needed to create the composer */

    scene = new THREE.Scene();
    const fov = 40;
    const aspect = 2;
    const near = 1.0;
    const far = 1000.0;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(80, 30, 80);
    camera.lookAt(new THREE.Vector3(20, 0, 20));

    controls = new OrbitControls(camera, canvas);

    // Resolve envmap promise.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    envMapTexture = pmremGenerator.fromEquirectangular(await envMapPromise).texture;
}

function recreateComposer(quality: SceneQuality) {
    if (quality >= SceneQuality.MEDIUM) {
        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        };
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, parameters);
        renderTarget.texture.encoding = THREE.sRGBEncoding;
        composer = new EffectComposer(renderer, renderTarget);
    } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
        composer = new EffectComposer(renderer);
    }

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

        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.x = 1 / size.x;
        fxaaPass.uniforms['resolution'].value.y = 1 / size.y;
        composer.addPass(fxaaPass);

        const smaaPass = new SMAAPass(200, 200);
        composer.addPass(smaaPass);

    }
    return [renderer, composer];
}

function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        // SSAO
        composer.passes[1].setSize(width, height);

        // FXAA
        composer.passes[3].uniforms['resolution'].value.x = 1 / width;
        composer.passes[3].uniforms['resolution'].value.y = 1 / height;
        // SMAA
        composer.passes[4].setSize(width, height);

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

export function setupScene(quality: SceneQuality) {
    scene.clear();

    recreateComposer(quality);

    renderer.shadowMap.enabled = true;
    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.PCFShadowMap;
    else
        renderer.shadowMap.type = THREE.PCFShadowMap;

    //scene.fog = new THREE.Fog(new THREE.Color('#ffffff').convertSRGBToLinear(), 100.0, 300.0);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(100, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    floor.rotateX(-Math.PI / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const light = new THREE.DirectionalLight(0xffffff, 2.0);
    light.position.set(100, 10, 70);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.top = 20;
    light.shadow.camera.near = 2.0; // default
    light.shadow.camera.far = 500; // default
    scene.add(light);

    scene.environment = envMapTexture;
    scene.background = envMapTexture;
}


export function render(delta: number) {
    if (!composer)
        return;
    resizeRendererToDisplaySize();
    composer.render();
    controls.update(delta);
    //renderer.info.reset();
}

const treeCache = {} as Record<string, THREE.Mesh>;

export async function loadTree(network: string, setId: string) {
    const treePromise = new Promise<THREE.Mesh>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            APP_ENV === 'dev' ?
                `https://api.briq.construction/v1/model/starknet-mainnet/${setId}.glb` :
                backendManager.getRoute(`model/${network}/${setId}.glb`),
            (gltf: any) => {
                resolve(gltf.scene.children.slice()[0]);
            },
            () => {},
            (error: any) => reject(error),
        );
    });
    const tree = await treePromise;
    treeCache[`${network}/${setId}`] = tree;
    tree.traverse(m => m.castShadow = true);
    tree.traverse(m => {
        m.receiveShadow = true;
        if (m.geometry) {
            m.geometry.computeVertexNormals();
            m.geometry.translate(1, 0.0, -1);
        }
        if (m.material)
            m.material.shadowSide = THREE.FrontSide;
    });
}

export function putTreeInScene(network: string, setId: string) {
    const copy = treeCache[`${network}/${setId}`].clone(true);
    scene.add(copy);
    return copy;
}

export function getRaycast(x, y) {
    if (!initialised)
        return undefined;
    const rc = new THREE.Raycaster();
    rc.setFromCamera({ x, y }, camera);
    const obj = rc.intersectObject(scene, true);
    if (obj?.[0]?.object?.parent?.userData?.owner)
        return obj?.[0]?.object.parent;
    return undefined;
}