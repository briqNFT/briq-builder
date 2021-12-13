import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { texture, tileSize, tileTextureHeight, nbMaterial } from '../../materials.js'

import { cellSize } from '../Constants'

import VoxelWorld from './VoxelWorld';
export var voxWorld;

import { store } from "../../store/Store"
//import { builderData } from "./builder/BuilderData"
import { builderDataEvents } from "../BuilderDataEvents"
import { dispatchedActions } from './dispatch'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { watchEffect } from 'vue';
import builderSettings from './Settings';

let builderData = store.state.builderData;

var camera;

// OrbitControls, exported so we can pass them to inputs.
export var orbitControls = {
  controls: undefined,
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

const material = new THREE.MeshLambertMaterial({
  map: texture,
  side: THREE.DoubleSide,
  alphaTest: 0.1,
  transparent: true,
});

function generateGrid() {
  var gridXZ = new THREE.GridHelper(cellSize*2+1, cellSize*2+1, builderSettings.gridColor, builderSettings.gridColor);
  gridXZ.position.set(1/2, 0, 1/2);
  return gridXZ;
}

function generatePlane() {
  var geometry = new THREE.PlaneBufferGeometry(cellSize*2+1, cellSize*2+1);
  var material = new THREE.MeshPhongMaterial( {color: builderSettings.planeColor, side: THREE.DoubleSide });
  var planeXZ = new THREE.Mesh(geometry, material);
  planeXZ.receiveShadow = true ;
  planeXZ.position.set(1/2, 0, 1/2);
  planeXZ.rotateX( - Math.PI / 2);
  return planeXZ;
}

import daylight_Back from '../../assets/skybox/Daylight-Box_Back.jpg'
import daylight_Bottom from '../../assets/skybox/Daylight-Box_Bottom.jpg'
import daylight_Front from '../../assets/skybox/Daylight-Box_Front.jpg'
import daylight_Left from '../../assets/skybox/Daylight-Box_Left.jpg'
import daylight_Right from '../../assets/skybox/Daylight-Box_Right.jpg'
import daylight_Top from '../../assets/skybox/Daylight-Box_Top.jpg'

function generateSkybox(scene) {

  const ctex = new THREE.DataTexture([255, 255, 255, 255], 1, 1, THREE.RGBAFormat);
  ctex.magFilter = THREE.NearestFilter;
  ctex.minFilter = THREE.NearestFilter;

  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    daylight_Right,
    daylight_Left,
    daylight_Top,
    daylight_Bottom,
    daylight_Front,
    daylight_Back
  ]);
  texture.color = 0xc94a00;
  return texture;
}

import { previewCube } from './PreviewCube'

export function resetCamera()
{
    camera.position.set(cellSize * 0.3, cellSize * 0.8, -cellSize * 1.4);
    orbitControls.controls.target.set(0, 1, 0);
    orbitControls.controls.update();
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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !!builderSettings.useRealAA });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

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

  return [renderer, composer];
};

export  function main(canvas) {  
  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  orbitControls.controls = new OrbitControls(camera, canvas);
  orbitControls.controls.enableDamping = true;
  resetCamera();
  
  const scene = new THREE.Scene();

  function addLight(x, y, z) {
    const color = 0xFFFFFF;
    const intensity = 1.0;
    const lightSpot = new THREE.DirectionalLight(color, intensity, 18);
    lightSpot.position.set(x, y, z);
    lightSpot.castShadow = true;
    lightSpot.shadow.bias = -0.005;
    lightSpot.shadow.camera.near = 0.1;
    lightSpot.shadow.camera.far = 50;
    lightSpot.shadow.camera.left=-cellSize*1.3;
    lightSpot.shadow.camera.right=cellSize*1.3;
    lightSpot.shadow.camera.bottom=-cellSize;
    lightSpot.shadow.camera.top=cellSize*3;
    lightSpot.shadow.mapSize.width = 1024;
    lightSpot.shadow.mapSize.height = 1024;
    scene.add(lightSpot);

    //scene.add(new THREE.CameraHelper(lightSpot.shadow.camera));

    const ambientLight = new THREE.AmbientLight(color, 0.7);
    scene.add(ambientLight);
  }
  addLight(-1*5,  2*5,  -3*5);

  scene.background = new THREE.Color(builderSettings.backgroundColor);//generateSkybox();
  scene.add(generateGrid());
  scene.add(generatePlane());
  scene.add(previewCube);

  voxWorld = new VoxelWorld({
    cellSize,
    tileSize,
    nbMaterial,
    tileTextureHeight,
  });
  voxWorld.scene = scene;
  const world = voxWorld;
  world.updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate

  var renderer, composer;
  // Recreate the renderer whenever things change.
  watchEffect(() => {
    if (renderer)
      renderer.dispose();
    [renderer, composer] = recreateRenderer(canvas, scene, camera);
  });

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
      else if (item.action === "place_briq")
      {
        voxWorld.setVoxel(...item.payload.pos, item.payload.color)
        voxWorld.updateVoxelGeometry(...item.payload.pos);
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
