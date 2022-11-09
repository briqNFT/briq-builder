import { dispatchedActions } from './Dispatch';

import { watchEffect } from 'vue';
import builderSettings from './Settings';

import {
    threeSetupComplete,
    THREE,
    OrbitControls,
    EffectComposer,
    RenderPass,
    SSAARenderPass,
    TAARenderPass,
    SSAOPass,
    SMAAPass,
    ShaderPass,
    GammaCorrectionShader,
    FXAAShader,
} from '@/three';

import { CONF } from '@/Conf';

import { getSetObject, grid, bounds, handleActions } from './SetRendering.js';
import { useDarkMode } from '@/DarkMode';

export var camera: THREE.Camera;

// OrbitControls, exported so we can pass them to inputs.
export var orbitControls = {
    controls: undefined,
};


function builderConf() {
    return CONF.builderSettings[useDarkMode() ? 'darkMode' : 'lightMode'];
}

function getCanvasSize() {
    if (!bounds.min)
        return 5;
    return Math.max(5, ...[0, 1, 2].map(i => bounds.max[i] - bounds.min[i]));
}

/*
import daylight_Back from '../../assets/skybox/Daylight-Box_Back.jpg'
import daylight_Bottom from '../../assets/skybox/Daylight-Box_Bottom.jpg'
import daylight_Front from '../../assets/skybox/Daylight-Box_Front.jpg'
import daylight_Left from '../../assets/skybox/Daylight-Box_Left.jpg'
import daylight_Right from '../../assets/skybox/Daylight-Box_Right.jpg'
import daylight_Top from '../../assets/skybox/Daylight-Box_Top.jpg'

function generateSkybox(scene) {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        daylight_Right,
        daylight_Left,
        daylight_Top,
        daylight_Bottom,
        daylight_Front,
        daylight_Back
    ]);
    return texture;
}
*/

import getPreviewCube from './PreviewCube';

function resetCamera() {
    camera.position.set(-getCanvasSize() * 0.3, getCanvasSize() * 0.8, getCanvasSize() * 1.4);
    orbitControls.controls.target.set(0, 1, 0);
    orbitControls.controls.update();
}

// TODO: horrible, this is a workaround for my dumb renderer handling.
let _takeScreenshot;
export function takeScreenshot() {
    return _takeScreenshot();
}
function _createTakeScreenshot(renderer, composer) {
    return function () {
        const old = getPreviewCube().visible;
        const old2 = selectionRender.parent?.visible;
        const oldBg = scene.background;
        overlayObjects.visible = false;
        underlayObjects.visible = false;
        getPreviewCube().visible = false;
        selectionRender.hide();
        grid.grid.visible = false;
        scene.background = null;
        composer.render();
        getPreviewCube().visible = old;
        if (old2)
            selectionRender.show();
        else
            selectionRender.hide();
        scene.background = oldBg;
        grid.grid.visible = true;
        overlayObjects.visible = true;
        underlayObjects.visible = true;
        return renderer.domElement.toDataURL('image/png');
    };
}

function resizeRendererToDisplaySize(renderer, composer, camera) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        if (builderSettings.aaLevel === 'FXAA') {
            composer.passes[composer.passes.length - 1].uniforms['resolution'].value.x = 1 / width;
            composer.passes[composer.passes.length - 1].uniforms['resolution'].value.y = 1 / height;
        }
        for (const pass of composer.passes)
            if (pass.setSize)
                pass.setSize(width, height);

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function recreateRenderer(canvas, scene, camera) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = builderSettings.aaLevel !== '0' ? THREE.VSMShadowMap : THREE.BasicShadowMap; //THREE.VSMShadowMap; //THREE.PCFShadowMap;
    //renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    const parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
    };
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, parameters);
    const composer = new EffectComposer(renderer, renderTarget);
    if (builderSettings.aaLevel !== '0' && builderSettings.aaLevel !== 'FXAA' && builderSettings.aaLevel !== 'SMAA') {
        const renderPass = new SSAARenderPass(scene, camera, 0x000000, 1.0);
        renderPass.sampleLevel = +builderSettings.aaLevel;
        composer.addPass(renderPass);
    } else {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        /*
        const renderPass = new TAARenderPass(scene, camera, 0xff0000, 0.0);
        renderPass.params = parameters;
        renderPass.sampleLevel = 0;
        renderPass.accumulate = false;
        renderPass.accumulateIndex = - 1;
        composer.addPass(renderPass);
        // */
    }
    if (builderSettings.useSAO) {
        const aoPass = new SSAOPass(scene, camera, 200, 200);
        aoPass.output = SSAOPass.OUTPUT.Default;
        aoPass.kernelRadius = 0.25;
        aoPass.minDistance = 0.0001;
        aoPass.maxDistance = 0.001;
        composer.addPass(aoPass);
    }
    {
        const overlayScene = new THREE.Scene();
        overlayScene.add(overlayObjects);

        // Create similar position lights but give them default lighting settings.
        const lightSpot = new THREE.DirectionalLight(new THREE.Color(0x888888), 1.0);
        lightSpot.position.set(-1 * 5, 2 * 5, -3 * 5);
        lightSpot.castShadow = false;
        overlayScene.add(lightSpot);
        const ambientLight = new THREE.AmbientLight(0x888888, 1.5);
        overlayScene.add(ambientLight);

        const renderPass = new RenderPass(overlayScene, camera);
        renderPass.clear = false;
        renderPass.clearDepth = true;
        composer.addPass(renderPass);
    }

    /* ThreeJS auto-renders the final pass to the screen directly, which breaks my scene layering. */
    /* Instead, add a manual 'write to screen' pass. Use it for sRGB correction while at it. */
    {
        const copyPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(copyPass);
    }

    if (builderSettings.aaLevel === 'FXAA') {
        const copyPass = new ShaderPass(FXAAShader);
        const size = new THREE.Vector2();
        renderer.getSize(size);
        copyPass.uniforms['resolution'].value.x = 1 / size.x;
        copyPass.uniforms['resolution'].value.y = 1 / size.y;
        composer.addPass(copyPass);
    } else if (builderSettings.aaLevel === 'SMAA') {
        const size = new THREE.Vector2();
        renderer.getSize(size);
        const copyPass = new SMAAPass(size.x, size.y);
        composer.addPass(copyPass);
    }

    _takeScreenshot = _createTakeScreenshot(renderer, composer);
    return [renderer, composer];
}

function addLight(scene: THREE.Scene, x: number, y: number, z: number) {
    const lightSpot = new THREE.DirectionalLight(new THREE.Color(0x888888).convertSRGBToLinear(), 2.0);
    lightSpot.position.set(x, y, z);
    lightSpot.castShadow = true;
    lightSpot.shadow.bias = getCanvasSize() ? -0.01 : -0.001;
    lightSpot.shadow.normalBias = 0.05;
    lightSpot.shadow.camera.near = 0.1;
    lightSpot.shadow.camera.far = getCanvasSize() * 3;
    lightSpot.shadow.camera.left = -getCanvasSize() * 1.3;
    lightSpot.shadow.camera.right = getCanvasSize() * 1.3;
    lightSpot.shadow.camera.bottom = -getCanvasSize();
    lightSpot.shadow.camera.top = getCanvasSize() * 3;
    lightSpot.shadow.mapSize.width = getCanvasSize() > 30 ? 2048 : 1024;
    lightSpot.shadow.mapSize.height = getCanvasSize() > 30 ? 2048 : 1024;
    scene.add(lightSpot);

    const ambientLight = new THREE.AmbientLight(new THREE.Color(0x888888).convertSRGBToLinear(), 2.0);
    scene.add(ambientLight);
}

let scene: THREE.Scene;

import { selectionRender } from '../inputs/Selection';
import { doDownload } from '@/url';
export var overlayObjects: THREE.Object3D;
export var underlayObjects: THREE.Object3D;

function setupScene() {
    if (!scene)
        scene = new THREE.Scene();
    scene.clear();

    addLight(scene, -1 * getCanvasSize() / 2, 2 * getCanvasSize() / 2, -3 * getCanvasSize() / 2);

    if (!builderSettings.transparentBackground)
        scene.background = new THREE.Color(builderConf().backgroundColor).convertSRGBToLinear();
    else
        scene.background = null;

    if (!grid.grid)
        grid.generate();

    if (!builderSettings.transparentBackground)
        scene.add(grid.grid);

    scene.add(getSetObject());

    scene.add(getPreviewCube());
    scene.add(underlayObjects);

    selectionRender.setScene(scene);

    return scene;
}

let renderer, composer;

export function render() {
    resizeRendererToDisplaySize(renderer, composer, camera);

    orbitControls.controls.update();

    handleActions(dispatchedActions);

    composer.render();
}

let _sceneSetup: CallableFunction;
export const sceneSetup = new Promise(resolve => {
    _sceneSetup = resolve;
});

export async function main(canvas) {
    await threeSetupComplete;

    overlayObjects = new THREE.Object3D();
    underlayObjects = new THREE.Object3D();

    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.5;
    const far = 500;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    orbitControls.controls = new OrbitControls(camera, canvas);
    orbitControls.controls.enableDamping = true;
    // Bump the damping a bit from the default of 0.05 to make camera movements more precise.
    orbitControls.controls.dampingFactor = 0.1;
    resetCamera();

    scene = setupScene();

    // Recreate the renderer whenever things change.
    watchEffect(() => {
        if (renderer)
            renderer.dispose();
        [renderer, composer] = recreateRenderer(canvas, scene, camera);
    });

    // Recreate the scene whenever necessary.
    watchEffect(() => {
        scene = setupScene();
    });

    render();

    /**
     * TAA
     */
    /*
    let taaAccumulator = undefined;
    orbitControls.controls.addEventListener('start', () => {
        if (taaAccumulator)
            clearTimeout(taaAccumulator);
        composer.passes[0].accumulate = false;
    });
    orbitControls.controls.addEventListener('end', () => {
        taaAccumulator = setTimeout(() => {
            composer.passes[0].accumulate = true;
            composer.passes[0].accumulateIndex = - 1;
        }, 500)
    });
    //*/

    canvas.addEventListener(
        'touchstart',
        (event) => {
            // prevent scrolling
            event.preventDefault();
        },
        { passive: false },
    );

    _sceneSetup();
}

export async function unmount() {
    scene.clear();
    console.log('totoro 0', renderer);
    renderer?.dispose();
}