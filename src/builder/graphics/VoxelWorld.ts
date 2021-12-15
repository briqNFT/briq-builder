import * as THREE from 'three'

import { materialByColor } from './Materials'

const material = materialByColor.material;

export default class VoxelWorld {
    cellSize: number;
    tileSize: number;
    nbMaterial: number;
    tileTextureHeight: number;
    cellSliceSize: number;
    cells: object;//Map<number, Uint8Array>;
    cellIdToMesh: Object;
    scene: any;
    static faces: Array<any>;
    
    constructor(options) {
        this.cellSize = options.cellSize;
        this.tileSize = options.tileSize;
        this.nbMaterial = options.nbMaterial;
        this.tileTextureHeight = options.tileTextureHeight;
        const {cellSize} = this;
        this.cellSliceSize = cellSize * cellSize;
        this.cells = {};
        
        this.cellIdToMesh = {};
        this.scene = null;
    }

    reset()
    {
        let cells = this.cells;
        this.cells = {};
        for (let cell in cells)
            this.updateCellGeometry(...cell.split(',').map(x => +x * this.cellSize));
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
    
    computeCellId(x, y, z) {
        const {cellSize} = this;
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const cellZ = Math.floor(z / cellSize);
        return `${cellX},${cellY},${cellZ}`;
    }
    
    addCellForVoxel(x, y, z) {
        const cellId = this.computeCellId(x, y, z);
        let cell = this.cells[cellId];
        if (!cell) {
            const {cellSize} = this;
            cell = new Uint8Array(cellSize * cellSize * cellSize);
            this.cells[cellId] = cell;
        }
        return cell;
    }
    
    getCellForVoxel(x, y, z) {
        return this.cells[this.computeCellId(x, y, z)];
    }
    
    setVoxel(x, y, z, color: string, addCell = true) {
        let cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            if (!addCell) {
                return;
            }
            cell = this.addCellForVoxel(x, y, z);
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        const v = materialByColor.getIndex(color);
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
        const {cellSize, tileSize, tileTextureHeight} = this;

        const positions = [];
        const normals = [];
        const uvs = [];
        const uv2s = [];
        const indices = [];
        const startX = cellX * cellSize;
        const startY = cellY * cellSize;
        const startZ = cellZ * cellSize;
        
        for (let y = 0; y < cellSize; ++y)
        {
            const voxelY = startY + y;
            for (let z = 0; z < cellSize; ++z)
            {
                const voxelZ = startZ + z;
                for (let x = 0; x < cellSize; ++x)
                {
                    const voxelX = startX + x;
                    const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
                    if (voxel)
                    {
                        // voxel 0 is sky (empty) so for UVs we start at 0
                        const uvVoxel = voxel - 1;
                        // There is a voxel here but do we need faces for it?
                        for (const {dir, corners, uvRow} of VoxelWorld.faces)
                        {
                            const neighbor = this.getVoxel(
                                voxelX + dir[0],
                                voxelY + dir[1],
                                voxelZ + dir[2]);
                                if (!neighbor)
                                {
                                    // this voxel has no neighbor in this direction so we need a face.
                                    const ndx = positions.length / 3;
                                    for (const {pos, uv} of corners)
                                    {
                                        positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                                        normals.push(...dir);
                                        uvs.push(...materialByColor.getUV(uvVoxel, uv));
                                        uv2s.push(...uv);
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
                uvs,
                uv2s,
                indices,
            };
        }

    updateCellGeometry(x, y, z) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        const cellZ = Math.floor(z / this.cellSize);
        const cellId = this.computeCellId(x, y, z);
        let mesh = this.cellIdToMesh[cellId];
        const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();
        
        const {positions, normals, uvs, uv2s, indices} = this.generateGeometryDataForCell(cellX, cellY, cellZ);
        const positionNumComponents = 3;
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
        const normalNumComponents = 3;
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
        const uvNumComponents = 2;
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
        geometry.setAttribute('uv2', new THREE.BufferAttribute(new Float32Array(uv2s), uvNumComponents));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
        
        if (!mesh) {
            mesh = new THREE.Mesh(geometry, material);
            mesh.name = cellId;
            this.cellIdToMesh[cellId] = mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            mesh.position.set(cellX * this.cellSize, cellY * this.cellSize, cellZ * this.cellSize);
        }
    }
    
    updateVoxelGeometry(x, y, z) {
        const neighborOffsets = [
            [ 0,  0,  0], // self
            [-1,  0,  0], // left
            [ 1,  0,  0], // right
            [ 0, -1,  0], // down
            [ 0,  1,  0], // up
            [ 0,  0, -1], // back
            [ 0,  0,  1], // front
        ];

        const updatedCellIds = {};
        for (const offset of neighborOffsets) {
            const ox = x + offset[0];
            const oy = y + offset[1];
            const oz = z + offset[2];
            const cellId = this.computeCellId(ox, oy, oz);
            if (!updatedCellIds[cellId]) {
                updatedCellIds[cellId] = true;
                this.updateCellGeometry(ox, oy, oz);
            }
        }
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
            if (voxel || iy < 0) {
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
        uvRow: 0,
        dir: [ -1,  0,  0, ],
        corners: [
            { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
            { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
            { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
            { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
        ],
    },
    { // right
        uvRow: 0,
        dir: [  1,  0,  0, ],
        corners: [
            { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
            { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
            { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
            { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
        ],
    },
    { // bottom
        uvRow: 1,
        dir: [  0, -1,  0, ],
        corners: [
            { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
            { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
            { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
            { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
        ],
    },
    { // top
        uvRow: 2,
        dir: [  0,  1,  0, ],
        corners: [
            { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
            { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
            { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
            { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
        ],
    },
    { // back
        uvRow: 0,
        dir: [  0,  0, -1, ],
        corners: [
            { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
            { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
            { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
            { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
        ],
    },
    { // front
        uvRow: 0,
        dir: [  0,  0,  1, ],
        corners: [
            { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
            { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
            { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
            { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
        ],
    },
];
