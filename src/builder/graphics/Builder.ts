
import { tileSize, tileTextureHeight, nbMaterial } from '../../materials.js'

import VoxelWorld from './VoxelWorld';
export var voxWorld: VoxelWorld;

import { dispatchedActions } from './Dispatch'

import { watchEffect } from 'vue';
import builderSettings from './Settings';

import {
    THREE, THREE_SETUP,
    OrbitControls,
    EffectComposer,
    RenderPass,
    SSAARenderPass,
    SAOPass,
} from '../../three';

var camera: THREE.Camera;

// OrbitControls, exported so we can pass them to inputs.
export var orbitControls = {
    controls: undefined,
};

function getCanvasSize()
{
    return Math.max(5, builderSettings.canvasSize);
};

/**
* 
* @param {number} x - % of canvas, left to right
* @param {number} y - % of canvas, toip to bottom
* @returns 
*/
export function getCameraRay(xin, yin)
{
    const x = (xin) *  2 - 1;
    const y = (yin) * -2 + 1;  // note we flip Y
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    start.setFromMatrixPosition(camera.matrixWorld);
    end.set(x, y, 1).unproject(camera);
    return [start, end];  
}

function generateGrid() {
    var gridXZ = new THREE.GridHelper(getCanvasSize()*2, getCanvasSize()*2, builderSettings.gridColor, builderSettings.gridColor);
    gridXZ.position.set(0, 0, 0);
    return gridXZ;
}

function generatePlane(scene) {
    var geometry = new THREE.PlaneBufferGeometry(getCanvasSize()*2, getCanvasSize()*2);
    var material = new THREE.MeshPhongMaterial( {color: builderSettings.planeColor, side: THREE.DoubleSide });
    var planeXZ = new THREE.Mesh(geometry, material);
    planeXZ.receiveShadow = true;
    planeXZ.position.set(0, 0, 0);
    planeXZ.rotateX( - Math.PI / 2);
    
    var planeUnderside = new THREE.Mesh(geometry, material);
    planeUnderside.position.set(0, -0.001, 0);
    planeUnderside.rotateX( - Math.PI / 2);
    planeUnderside.rotateY(Math.PI);
    
    scene.add(planeXZ);
    scene.add(planeUnderside);
}

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

import getPreviewCube from './PreviewCube'

export function resetCamera()
{
    camera.position.set(getCanvasSize() * 0.3, getCanvasSize() * 0.8, -getCanvasSize() * 1.4);
    orbitControls.controls.target.set(0, 1, 0);
    orbitControls.controls.update();
}

// TODO: horrible, this is a workaround for my dumb renderer handling.
var _takeScreenshot;
export function takeScreenshot()
{
    return _takeScreenshot();
}
function _createTakeScreenshot(renderer, composer) {
    return function() {
        let old = getPreviewCube().visible;
        let old2 = selectionRender.parent?.visible;
        getPreviewCube().visible = false;
        selectionRender.hide();
        composer.render();
        getPreviewCube().visible = old;
        if (old2)
        selectionRender.show();
        else
        selectionRender.hide();
        return renderer.domElement.toDataURL("image/png");
    };
}

function resizeRendererToDisplaySize(renderer, composer, camera) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize)
    {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
        /*
        TODO: FXAA
        if (composer.passes.length === 3)
        {
            composer.passes[2].uniforms['resolution'].value.x = 1 / width;
            composer.passes[2].uniforms['resolution'].value.y = 1 / height;
        }
        */
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

function recreateRenderer(canvas, scene, camera)
{
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !!builderSettings.useRealAA });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    renderer.setClearColor(0x000000);
    renderer.setClearAlpha(0);
    
    const composer = new EffectComposer(renderer);
    if (builderSettings.useRealAA)
    {
        const renderPass = new SSAARenderPass(scene, camera);
        renderPass.sampleLevel = 2;
        composer.addPass(renderPass);
    }
    else
    {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
    }
    if (builderSettings.useSAO)
    {
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
            saoBlurDepthCutoff: 0.01
        };
        composer.addPass(saoPass); 
        /*
        if (builderSettings.useRealAA)
        {
            let effectFXAA = new ShaderPass(FXAAShader);
            composer.addPass( effectFXAA );   
        }
        */
    }
    resizeRendererToDisplaySize(renderer, composer, camera);
    _takeScreenshot = _createTakeScreenshot(renderer, composer);
    return [renderer, composer];
};

function addLight(scene, x, y, z) {
    const lightSpot = new THREE.DirectionalLight(builderSettings.lightColor, 1.0, 18);
    lightSpot.position.set(x, y, z);
    lightSpot.castShadow = true;
    lightSpot.shadow.bias = -0.005;
    lightSpot.shadow.camera.near = 0.1;
    lightSpot.shadow.camera.far = 50;
    lightSpot.shadow.camera.left=-getCanvasSize()*1.3;
    lightSpot.shadow.camera.right=getCanvasSize()*1.3;
    lightSpot.shadow.camera.bottom=-getCanvasSize();
    lightSpot.shadow.camera.top=getCanvasSize()*3;
    lightSpot.shadow.mapSize.width = 1024;
    lightSpot.shadow.mapSize.height = 1024;
    scene.add(lightSpot);
    
    const ambientLight = new THREE.AmbientLight(builderSettings.ambientColor, 1.5);
    scene.add(ambientLight);
}

var scene: THREE.Scene;

import { selectionRender } from '../inputs/Selection';

function setupScene(voxWorld)
{
    if (!scene)
    scene = new THREE.Scene();
    scene.clear();
    
    addLight(scene, -1*5,  2*5,  -3*5);
    
    if (!builderSettings.transparentBackground)
    scene.background = new THREE.Color(builderSettings.backgroundColor);
    
    if (builderSettings.showPlane)
    {
        if (builderSettings.showGrid)
        scene.add(generateGrid());
        generatePlane(scene);
    }
    scene.add(getPreviewCube());
    
    voxWorld.scene = scene;
    for (let cid in voxWorld.cellIdToMesh)
    scene.add(voxWorld.cellIdToMesh[cid]);
    //voxWorld.updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate
    
    selectionRender.setScene(scene);
    
    return scene;
}

function updateScene()
{
    scene = setupScene(voxWorld);
}

export async function main(canvas) {
    await THREE_SETUP;
    
    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    
    orbitControls.controls = new OrbitControls(camera, canvas);
    orbitControls.controls.enableDamping = true;
    resetCamera();
    
    voxWorld = new VoxelWorld({
        cellSize: 10,
        tileSize,
        nbMaterial,
        tileTextureHeight,
    });
    const world = voxWorld;
    
    scene = setupScene(voxWorld);
    
    var renderer, composer;
    
    // Recreate the renderer whenever things change.
    watchEffect(() => {
        if (renderer)
        renderer.dispose();
        [renderer, composer] = recreateRenderer(canvas, scene, camera);
    })
    
    // Recreate the scene whenever necessary.
    watchEffect(() => {
        updateScene();
    })
    
    let renderRequested = false;
    
    function render() {
        renderRequested = undefined;
        
        resizeRendererToDisplaySize(renderer, composer, camera);
        
        orbitControls.controls.update();
        
        for (let item of dispatchedActions)
        {
            if (item.action === "select_set")
            {
                voxWorld.reset();
                for (let cell of item.payload)
                {
                    voxWorld.setVoxel(...cell.pos, cell.color)
                    voxWorld.updateVoxelGeometry(...cell.pos);
                }
            }
            else if (item.action === "place_briqs")
            {
                for (let data of item.payload)
                {
                    voxWorld.setVoxel(...data.pos, data?.color ?? "")
                    voxWorld.updateVoxelGeometry(...data.pos);  
                }
            }
            else if (item.action === "reset")
            {
                voxWorld.reset();
            }
        }
        dispatchedActions.length = 0;
        
        composer.render();
        requestAnimationFrame(render);
    }
    render();
    
    canvas.addEventListener('touchstart', (event) => {
        // prevent scrolling
        event.preventDefault();
    }, {passive: false});
}