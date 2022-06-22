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
    SAOPass,
    ShaderPass,
    CopyShader,
    FXAAShader,
} from '@/three';

export var camera: THREE.Camera;

// OrbitControls, exported so we can pass them to inputs.
export var orbitControls = {
    controls: undefined,
};

function getCanvasSize() {
    return Math.max(5, builderSettings.canvasSize);
}

function generateGrid() {
    const gridXZ = new THREE.GridHelper(
        getCanvasSize() * 2,
        getCanvasSize() * 2,
        builderSettings.gridColor,
        builderSettings.gridColor,
    );
    gridXZ.position.set(0, 0, 0);
    return gridXZ;
}

function generatePlane(scene: THREE.Scene) {
    const geometry = new THREE.PlaneBufferGeometry(getCanvasSize() * 2, getCanvasSize() * 2);
    const material = new THREE.MeshPhongMaterial({ color: builderSettings.planeColor, side: THREE.FrontSide });
    const planeXZ = new THREE.Mesh(geometry, material);
    planeXZ.receiveShadow = true;
    planeXZ.position.set(0, -0.01, 0);
    planeXZ.rotateX(-Math.PI / 2);

    const planeUnderside = new THREE.Mesh(geometry, material);
    planeUnderside.position.set(0, -0.015, 0);
    planeUnderside.rotateX(Math.PI / 2);

    scene.add(planeXZ);
    scene.add(planeUnderside);
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
    camera.position.set(getCanvasSize() * 0.3, getCanvasSize() * 0.8, -getCanvasSize() * 1.4);
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
        overlayObjects.visible = false;
        getPreviewCube().visible = false;
        selectionRender.hide();
        composer.render();
        getPreviewCube().visible = old;
        if (old2)
            selectionRender.show();
        else
            selectionRender.hide();
        overlayObjects.visible = true;
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
            composer.passes[1].uniforms['resolution'].value.x = 1 / width;
            composer.passes[1].uniforms['resolution'].value.y = 1 / height;
        }
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function recreateRenderer(canvas, scene, camera) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = builderSettings.aaLevel !== "0" ? THREE.VSMShadowMap : THREE.BasicShadowMap; //THREE.VSMShadowMap; //THREE.PCFShadowMap;

    renderer.setClearColor(0x000000, 0);

    const composer = new EffectComposer(renderer);
    if (builderSettings.aaLevel !== '0' && builderSettings.aaLevel !== 'FXAA') {
        const renderPass = new SSAARenderPass(scene, camera);
        renderPass.sampleLevel = +builderSettings.aaLevel;
        composer.addPass(renderPass);
    } else {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        if (builderSettings.aaLevel === 'FXAA') {
            var copyPass = new ShaderPass(FXAAShader);
            const size = new THREE.Vector2();
            renderer.getSize(size);
            copyPass.uniforms['resolution'].value.x = 1 / size.x;
            copyPass.uniforms['resolution'].value.y = 1 / size.y;
            composer.addPass(copyPass);
        }
    }
    if (builderSettings.useSAO) {
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
    /* Instead, add a manual 'write to screen' pass */
    {
        var copyPass = new ShaderPass(CopyShader);
        composer.addPass(copyPass);
    }
    //resizeRendererToDisplaySize(renderer, composer, camera);
    _takeScreenshot = _createTakeScreenshot(renderer, composer);
    return [renderer, composer];
}

function addLight(scene: THREE.Scene, x: number, y: number, z: number) {
    const lightSpot = new THREE.DirectionalLight(builderSettings.lightColor, 1.0);
    lightSpot.position.set(x, y, z);
    lightSpot.castShadow = true;
    lightSpot.shadow.bias = builderSettings.canvasSize > 30 ? -0.01 : -0.001;
    lightSpot.shadow.normalBias = 0.05;
    lightSpot.shadow.camera.near = 0.1;
    lightSpot.shadow.camera.far = getCanvasSize() * 3;
    lightSpot.shadow.camera.left = -getCanvasSize() * 1.3;
    lightSpot.shadow.camera.right = getCanvasSize() * 1.3;
    lightSpot.shadow.camera.bottom = -getCanvasSize();
    lightSpot.shadow.camera.top = getCanvasSize() * 3;
    lightSpot.shadow.mapSize.width = builderSettings.canvasSize > 30 ? 2048 : 1024;
    lightSpot.shadow.mapSize.height = builderSettings.canvasSize > 30 ? 2048 : 1024;
    scene.add(lightSpot);

    const ambientLight = new THREE.AmbientLight(builderSettings.ambientColor, 1.25);
    scene.add(ambientLight);
}

let scene: THREE.Scene;

import { selectionRender } from '../inputs/Selection';
import { getSetObject, handleActions } from './SetRendering.js';
export var overlayObjects: THREE.Object3D;

function setupScene() {
    if (!scene)
        scene = new THREE.Scene();
    scene.clear();

    addLight(scene, -1 * getCanvasSize() / 2, 2 * getCanvasSize() / 2, -3 * getCanvasSize() / 2);

    if (!builderSettings.transparentBackground)
        scene.background = new THREE.Color(builderSettings.backgroundColor);
    else
        scene.background = null;

    if (builderSettings.showPlane) {
        if (builderSettings.showGrid)
            scene.add(generateGrid());
        generatePlane(scene);
    }

    scene.add(getSetObject());

    scene.add(getPreviewCube());

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

export async function main(canvas) {
    await threeSetupComplete;

    overlayObjects = new THREE.Object3D();

    const fov = 75;
    const aspect = 2; // the canvas default
    const near = 0.5;
    const far = 500;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    orbitControls.controls = new OrbitControls(camera, canvas);
    orbitControls.controls.enableDamping = true;
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

    canvas.addEventListener(
        'touchstart',
        (event) => {
            // prevent scrolling
            event.preventDefault();
        },
        { passive: false },
    );
}
