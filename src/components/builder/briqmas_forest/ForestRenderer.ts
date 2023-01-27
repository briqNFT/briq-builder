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

import EnvMapImg from '@/assets/genesis/WhiteRoom.png';
import { backendManager } from '@/Backend';

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

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    canvas = _canvas;

    if (renderer)
        renderer.dispose();

    // Recreate the renderer, because the canvas may need updating.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });

    // Conceptually, we don't really need to reload what's below, but it leads to a blank scene.
    // I guess the GLB loader keeps a reference to the renderer somehow.
    const defaultLoader = new THREE.TextureLoader();

    let envMapRawTexture: THREE.Texture;
    const envMapPromise = new Promise<THREE.Texture>(resolve => defaultLoader.load(EnvMapImg, (tex) => {
        envMapRawTexture = tex;
        resolve(envMapRawTexture);
    }));

    /* Create these early, they're needed to create the composer */

    scene = new THREE.Scene();
    const fov = 40;
    const aspect = 2;
    const near = 1.0;
    const far = 1000.0;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(70, 30, 70);
    camera.lookAt(new THREE.Vector3(0, 2, 0));

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

    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.BasicShadowMap;
    else
        renderer.shadowMap.type = THREE.VSMShadowMap;

    scene.fog = new THREE.Fog(new THREE.Color('#ffffff').convertSRGBToLinear(), 100.0, 300.0);

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
        if (m.geometry)
            m.geometry.computeVertexNormals();
        if (m.material)
            m.material.shadowSide = THREE.FrontSide;
    });
}

export function putTreeInScene(network: string, setId: string) {
    const copy = treeCache[`${network}/${setId}`].clone(true);
    scene.add(copy);
    return copy;
}
