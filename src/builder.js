import * as THREE from 'three';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';

import { picker, texture, tileSize, tileTextureHeight, nbMaterial } from './materials.js'

const cellSize = 5;

import VoxelWorld from './VoxelWorld';
import { BuilderInputFSM } from './BuilderInput';

export var builderInputFsm = new BuilderInputFSM();

export var voxWorld;

var camera;

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
  var gridXZ = new THREE.GridHelper(cellSize*2, cellSize*2, 0xffff00, 0xffff00);
  gridXZ.position.set(Math.floor(cellSize/2), 0,Math.floor(cellSize/2));
  return gridXZ;
}
function generatePlane(){
  var geometry = new THREE.PlaneBufferGeometry(cellSize*2, cellSize*2);
  var material = new THREE.MeshPhongMaterial( {color: 0x009624, side: THREE.DoubleSide });
  var planeXZ = new THREE.Mesh(geometry, material);
  planeXZ.receiveShadow = true ;
  planeXZ.position.set(Math.floor(cellSize/2), 0,Math.floor(cellSize/2));
  planeXZ.rotateX( - Math.PI / 2);
  return planeXZ;
}

import { previewCube } from './PreviewCube'

import daylight_Back from './assets/skybox/Daylight-Box_Back.jpg'
import daylight_Bottom from './assets/skybox/Daylight-Box_Bottom.jpg'
import daylight_Front from './assets/skybox/Daylight-Box_Front.jpg'
import daylight_Left from './assets/skybox/Daylight-Box_Left.jpg'
import daylight_Right from './assets/skybox/Daylight-Box_Right.jpg'
import daylight_Top from './assets/skybox/Daylight-Box_Top.jpg'

export  function main(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  
  

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-cellSize * .3, cellSize * .8, -cellSize * .3);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(cellSize / 2, cellSize / 3, cellSize / 2);
  controls.update();

  const scene = new THREE.Scene();

  function generateSkybox() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      daylight_Right,
      daylight_Left,
      daylight_Top,
      daylight_Bottom,
      daylight_Front,
      daylight_Back
    ]);
    scene.background = texture;
}
generateSkybox()

  function addLight(x, y, z) {
    const color = 0xFFFFFF;
    const intensity = 1.0;
    const lightSpot = new THREE.DirectionalLight(color, intensity, 18);
    lightSpot.position.set(x, y, z);
    lightSpot.castShadow = true;
    lightSpot.shadow.bias = +0.01;
    lightSpot.shadow.camera.near = 0.1;
    lightSpot.shadow.camera.far = 100;
    lightSpot.shadow.camera.left=-cellSize*2;
    lightSpot.shadow.camera.right=cellSize*2;
    lightSpot.shadow.camera.bottom=-cellSize;
    lightSpot.shadow.camera.top=cellSize*3;

    //scene.add(new THREE.CameraHelper(lightSpot.shadow.camera));

    const ambientLight = new THREE.AmbientLight(color, 0.7);
    scene.add(ambientLight);
    scene.add(lightSpot);
  }
  addLight(-10,  20,  -40);

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

  /*
  for (let y = 0; y < cellSize; ++y) {
    for (let z = 0; z < cellSize; ++z) {
      for (let x = 0; x < cellSize; ++x) {
        const height = (Math.sin(x / cellSize * Math.PI * 2) + Math.sin(z / cellSize * Math.PI * 3)) * (cellSize / 6) + (cellSize / 2);
        if (y < height) {
          world.setVoxel(x, y, z, randInt(1, nbMaterial*tileTextureHeight+1));
        }
      }
    }
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
*/

  world.updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let renderRequested = false;

  function render() {
    renderRequested = undefined;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }

  function placeVoxel(event) {
    const pos = getCanvasRelativePosition(event);
    const x = (pos.x / canvas.width ) *  2 - 1;
    const y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    start.setFromMatrixPosition(camera.matrixWorld);
    end.set(x, y, 1).unproject(camera);

    const intersection = world.intersectRay(start, end);
    if (intersection) {
      const voxelId = event.shiftKey ? 0 : picker.material;
      // the intersection point is on the face. That means
      // the math imprecision could put us on either side of the face.
      // so go half a normal into the voxel if removing (pickerMaterial = 0)
      // our out of the voxel if adding (pickerMaterial  > 0)
      const pos = intersection.position.map((v, ndx) => {
        return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
      });
      world.setVoxel(...pos, voxelId);
      world.updateVoxelGeometry(...pos);
    }
  }

  const mouse = {
    x: 0,
    y: 0,
  };

  function recordStartPosition(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.moveX = 0;
    mouse.moveY = 0;
  }
  function recordMovement(event) {
    mouse.moveX += Math.abs(mouse.x - event.clientX);
    mouse.moveY += Math.abs(mouse.y - event.clientY);
  }/*
  function placeVoxelIfNoMovement(event) {
    if (mouse.moveX < 5 && mouse.moveY < 5) {
      placeVoxel(event);
    }
    window.removeEventListener('pointermove', recordMovement);
    window.removeEventListener('pointerup', placeVoxelIfNoMovement);
  }
  canvas.addEventListener('pointermove', updatePreviewCube);
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    recordStartPosition(event);
    window.addEventListener('pointermove', recordMovement);
    window.addEventListener('pointerup', placeVoxelIfNoMovement);
  }, {passive: false});*/
  canvas.addEventListener('touchstart', (event) => {
    // prevent scrolling
    event.preventDefault();
  }, {passive: false});
}
