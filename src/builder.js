import * as THREE from 'three';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';

//no need to export VoxelWorld, it's used by main and that function is already exported to HelloWorld

const materials = ["Wood", "Stone", "Glass", "Gold"];


class VoxelWorld {
    constructor(cellSize) {
      this.cellSize = cellSize;
      this.cellSliceSize = cellSize * cellSize;
      this.cell = new Uint8Array(cellSize * cellSize * cellSize);
    }
    computeVoxelOffset(x, y, z) {
      const {cellSize, cellSliceSize} = this;
      const voxelX = THREE.MathUtils.euclideanModulo(x, cellSize) | 0;
      const voxelY = THREE.MathUtils.euclideanModulo(y, cellSize) | 0;
      const voxelZ = THREE.MathUtils.euclideanModulo(z, cellSize) | 0;
      return voxelY * cellSliceSize +
             voxelZ * cellSize +
             voxelX;
    }
    getCellForVoxel(x, y, z) {
      const {cellSize} = this;
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const cellZ = Math.floor(z / cellSize);
      if (cellX !== 0 || cellY !== 0 || cellZ !== 0) {
        return null;
      }
      return this.cell;
    }
    setVoxel(x, y, z, v) {
      const cell = this.getCellForVoxel(x, y, z);
      if (!cell) {
        return;  // TODO: add a new cell?
      }
      const voxelOffset = this.computeVoxelOffset(x, y, z);
      cell[voxelOffset] = v;
    }
    getVoxel(x, y, z) {
      const cell = this.getCellForVoxel(x, y, z);
      if (!cell) {
        return 0;
      }
      const voxelOffset = this.computeVoxelOffset(x, y, z);
      return cell[voxelOffset];
    }
    generateGeometryDataForCell(cellX, cellY, cellZ) {
      const {cellSize} = this;
      const positions = [];
      const normals = [];
      const indices = [];
      const startX = cellX * cellSize;
      const startY = cellY * cellSize;
      const startZ = cellZ * cellSize;
  
      for (let y = 0; y < cellSize; ++y) {
        const voxelY = startY + y;
        for (let z = 0; z < cellSize; ++z) {
          const voxelZ = startZ + z;
          for (let x = 0; x < cellSize; ++x) {
            const voxelX = startX + x;
            const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
            if (voxel) {
              // There is a voxel here but do we need faces for it?
              for (const {dir, corners} of VoxelWorld.faces) {
                const neighbor = this.getVoxel(
                    voxelX + dir[0],
                    voxelY + dir[1],
                    voxelZ + dir[2]);
                if (!neighbor) {
                  // this voxel has no neighbor in this direction so we need a face.
                  const ndx = positions.length / 3;
                  for (const pos of corners) {
                    positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                    normals.push(...dir);
                  }
                  indices.push(
                    ndx, ndx + 1, ndx + 2,
                    ndx + 2, ndx + 1, ndx + 3,
                  );
                }
              }
            }
          }
        }
      }
  
      return {
        positions,
        normals,
        indices,
      };
    }
  
      // from
      // http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
      intersectRay(start, end) {
      let dx = end.x - start.x;
      let dy = end.y - start.y;
      let dz = end.z - start.z;
      const lenSq = dx * dx + dy * dy + dz * dz;
      const len = Math.sqrt(lenSq);
  
      dx /= len;
      dy /= len;
      dz /= len;
  
      let t = 0.0;
      let ix = Math.floor(start.x);
      let iy = Math.floor(start.y);
      let iz = Math.floor(start.z);
  
      const stepX = (dx > 0) ? 1 : -1;
      const stepY = (dy > 0) ? 1 : -1;
      const stepZ = (dz > 0) ? 1 : -1;
  
      const txDelta = Math.abs(1 / dx);
      const tyDelta = Math.abs(1 / dy);
      const tzDelta = Math.abs(1 / dz);
  
      const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
      const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
      const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);
  
      // location of nearest voxel boundary, in units of t
      let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
      let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
      let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;
  
      let steppedIndex = -1;
  
      // main loop along raycast vector
      while (t <= len) {
        const voxel = this.getVoxel(ix, iy, iz);
        if (voxel) {
          return {
            position: [
              start.x + t * dx,
              start.y + t * dy,
              start.z + t * dz,
            ],
            normal: [
              steppedIndex === 0 ? -stepX : 0,
              steppedIndex === 1 ? -stepY : 0,
              steppedIndex === 2 ? -stepZ : 0,
            ],
            voxel,
          };
        }
  
        // advance t to next nearest voxel boundary
        if (txMax < tyMax) {
          if (txMax < tzMax) {
            ix += stepX;
            t = txMax;
            txMax += txDelta;
            steppedIndex = 0;
          } else {
            iz += stepZ;
            t = tzMax;
            tzMax += tzDelta;
            steppedIndex = 2;
          }
        } else {
          if (tyMax < tzMax) {
            iy += stepY;
            t = tyMax;
            tyMax += tyDelta;
            steppedIndex = 1;
          } else {
            iz += stepZ;
            t = tzMax;
            tzMax += tzDelta;
            steppedIndex = 2;
          }
        }
      }
      return null;
    }
  }
  
  VoxelWorld.faces = [
    { // left
      dir: [ -1,  0,  0, ],
      corners: [
        [ 0, 1, 0 ],
        [ 0, 0, 0 ],
        [ 0, 1, 1 ],
        [ 0, 0, 1 ],
      ],
    },
    { // right
      dir: [  1,  0,  0, ],
      corners: [
        [ 1, 1, 1 ],
        [ 1, 0, 1 ],
        [ 1, 1, 0 ],
        [ 1, 0, 0 ],
      ],
    },
    { // bottom
      dir: [  0, -1,  0, ],
      corners: [
        [ 1, 0, 1 ],
        [ 0, 0, 1 ],
        [ 1, 0, 0 ],
        [ 0, 0, 0 ],
      ],
    },
    { // top
      dir: [  0,  1,  0, ],
      corners: [
        [ 0, 1, 1 ],
        [ 1, 1, 1 ],
        [ 0, 1, 0 ],
        [ 1, 1, 0 ],
      ],
    },
    { // back
      dir: [  0,  0, -1, ],
      corners: [
        [ 1, 0, 0 ],
        [ 0, 0, 0 ],
        [ 1, 1, 0 ],
        [ 0, 1, 0 ],
      ],
    },
    { // front
      dir: [  0,  0,  1, ],
      corners: [
        [ 0, 0, 1 ],
        [ 1, 0, 1 ],
        [ 0, 1, 1 ],
        [ 1, 1, 1 ],
      ],
    },
  ];
  
  export function main(canvas) { //need to target the canvas element that will be served in HelloWorld.vue
    const renderer = new THREE.WebGLRenderer({canvas});
  
    const cellSize = 21;
    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-cellSize * .3, cellSize * .8, -cellSize * .3);
  
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(cellSize / 2, cellSize / 3, cellSize / 2);
    controls.update();
  
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('lightblue');
  
    function addLight(x, y, z) {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      scene.add(light);
    }
    addLight(-1,  2,  4);
    addLight( 1, -1, -2);
  
    const world = new VoxelWorld(cellSize);
  
    for (let y = 0; y < cellSize; ++y) {
      for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
          const height = (Math.sin(x / cellSize * Math.PI * 2) + Math.sin(z / cellSize * Math.PI * 3)) * (cellSize / 6) + (cellSize / 2);
          if (y < height) {
            world.setVoxel(x, y, z, 1);
          }
        }
      }
    }
  
    const {positions, normals, indices} = world.generateGeometryDataForCell(0, 0, 0);
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshLambertMaterial({color: 'green'});
  
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  
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
    }
    render();
  
    function requestRenderIfNotRequested() {
      if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
      }
    }
  
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
        const voxelId = event.shiftKey ? 0 : currentVoxel;
        // the intersection point is on the face. That means
        // the math imprecision could put us on either side of the face.
        // so go half a normal into the voxel if removing (currentVoxel = 0)
        // our out of the voxel if adding (currentVoxel  > 0)
        const pos = intersection.position.map((v, ndx) => {
          return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
        });
        world.setVoxel(...pos, voxelId);
        updateVoxelGeometry(...pos);
        requestRenderIfNotRequested();
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
    }
    function placeVoxelIfNoMovement(event) {
      if (mouse.moveX < 5 && mouse.moveY < 5) {
        placeVoxel(event);
      }
      window.removeEventListener('pointermove', recordMovement);
      window.removeEventListener('pointerup', placeVoxelIfNoMovement);
    }
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      recordStartPosition(event);
      window.addEventListener('pointermove', recordMovement);
      window.addEventListener('pointerup', placeVoxelIfNoMovement);
    }, {passive: false});
    canvas.addEventListener('touchstart', (event) => {
      // prevent scrolling
      event.preventDefault();
    }, {passive: false});
  
    controls.addEventListener('change', requestRenderIfNotRequested);
    window.addEventListener('resize', requestRenderIfNotRequested);

    function addPlane(){
        var gridXZ = new THREE.GridHelper(cellSize*2, cellSize*2);
        gridXZ.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
        gridXZ.position.set(Math.floor(cellSize/2), 0,Math.floor(cellSize/2));
        scene.add(gridXZ);
    }
    addPlane()
}
