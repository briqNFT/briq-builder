import { THREE, threeSetupComplete } from '@/three';

import VoxelWorld from './VoxelWorld';

import { camera, orbitControls } from './Builder';
import { generateSkybox } from './Skybox';

import RealmsPic from '@/assets/realms.png';

function generateRealms() {
    const loader = new THREE.TextureLoader();
    return loader.load(RealmsPic);
}

import { GLTFLoader } from '@/three';

import Keystone from '@/assets/keystone-square-uv.glb?url';
import { getRenderMaterial } from './MaterialsRendering';

const loadKeystoneMesh = (() => {
    const promise = new Promise(async (resolve, reject) => {
        await threeSetupComplete;
        const loader = new GLTFLoader();
        loader.load(
            Keystone,
            (gltf: any) => {
                const mesh = gltf.scene.children[0] as unknown as THREE.Mesh;
                mesh.geometry.translate(0.5, 0.5, 0.5);
                resolve(mesh);
            },
            () => {},
            (error: any) => reject(error),
        );
    }) as Promise<THREE.Mesh>;
    return function () {
        return promise;
    };
})();

let currentSet = '';

let setObject: THREE.Object3D;

let voxels: { [material: string]: VoxelWorld } = {};
const nfts: { [key: string]: briqNFT } = {};

class briqNFT {
    id: string;
    mesh: THREE.Mesh;
    position: [number, number, number] | undefined;

    constructor(id: string) {
        this.id = id;
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.5,
            metalness: 0.9,
            envMap: generateSkybox(),
            bumpMap: generateRealms(),
            bumpScale: 0.1,
            roughnessMap: generateRealms(),
        });
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 10, 10, 10), material);
        this.mesh.geometry.translate(0.5, 0.5, 0.5);
        loadKeystoneMesh().then((mesh) => (this.mesh.geometry = mesh.geometry));
        this.mesh.userData.nft = this.id;
    }

    setPos(position?: [number, number, number]) {
        const oldPos = this.position?.slice();
        this.position = position;
        if (!oldPos && this.position) {
            this.mesh.visible = true;
            this.mesh.position.set(...this.position);
            setObject.add(this.mesh);
        } else if (oldPos && !this.position)
            setObject.remove(this.mesh);
        else if (this.position)
            this.mesh.position.set(...this.position);
    }
}

export function getSetObject() {
    if (setObject)
        return setObject;
    setObject = new THREE.Object3D();
    for (const mat in voxels)
        setObject.add(voxels[mat].object);
    return setObject;
}

export function getIntersectionPos(xScreen: number, yScreen: number) {
    const x = xScreen * 2 - 1;
    const y = yScreen * -2 + 1; // note we flip Y
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    start.setFromMatrixPosition(camera.matrixWorld);
    end.set(x, y, 1).unproject(camera);

    const rc = new THREE.Raycaster();
    rc.setFromCamera({ x, y }, camera);
    const obj = rc.intersectObject(getSetObject(), true);
    if (obj?.[0]?.object?.userData?.nft)
        return {
            position: [obj[0].point.x, obj[0].point.y, obj[0].point.z],
            normal: [obj[0].face?.normal.x, obj[0].face?.normal.y, obj[0].face?.normal.z],
        };
    let closest = undefined;
    let bestD = 0;
    for (const mat in voxels) {
        const int = voxels[mat].intersectRay(start, end);
        if (!int)
            continue;
        // TODO: improve
        const d = rc.ray.origin.distanceToSquared(new THREE.Vector3(...int.position));
        if (!closest || d <= bestD) {
            bestD = d;
            closest = int;
        }
    }
    if (closest)
        return closest;
    closest = rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (!closest)
        return undefined;
    return {
        position: [closest.x, closest.y, closest.z],
        normal: [0, 1, 0],
    };
}

export const bounds = {};

function reset() {
    for (const mat in voxels)
        voxels[mat].reset();
    voxels = {};
    for (const id in nfts)
        nfts[id].setPos();
    setObject.clear();
    bounds.min = undefined; //new THREE.Vector3(0, 0, 0);
    bounds.max = undefined; //new THREE.Vector3(0, 0, 0);
}

function getVoxelWorld(material: string) {
    if (!voxels[material]) {
        voxels[material] = new VoxelWorld({ cellSize: 10, material: getRenderMaterial(material) });
        setObject.add(voxels[material].object);
    }
    return voxels[material];
}

function updateBounds(pos) {
    if (!bounds.min) {
        bounds.min = pos;
        bounds.max = pos;
        return;
    }
    bounds.min = [0, 1, 2].map(i => Math.min(pos[i], bounds.min[i]));
    bounds.max = [0, 1, 2].map(i => Math.max(pos[i], bounds.max[i]));
}

export function handleActions(dispatchedActions: Array<{ action: string; payload: any }>) {
    for (const item of dispatchedActions)
        if (item.action === 'select_set') {
            reset();
            for (const data of item.payload.briqs) {
                updateBounds(data.pos);
                if (data.id) {
                    if (!(data.id in nfts))
                        nfts[data.id] = new briqNFT(data.id);
                    nfts[data.id].setPos(data.pos);
                } else
                    getVoxelWorld(data.material).setVoxel(...data.pos, data?.color ?? '');
            }
            currentSet = item.payload.setId;
        } else if (item.action === 'place_briq' || item.action === 'remove_briq') {
            const data = item.payload;
            if (data.set !== currentSet)
                continue;
            updateBounds(data.position);
            if (data?.briq?.id)
                // NFT
                if (item.action === 'remove_briq')
                    nfts[data.briq.id].setPos();
                else {
                    if (!(data.briq.id in nfts))
                        nfts[data.briq.id] = new briqNFT(data.briq.id);
                    nfts[data.briq.id].setPos(data.position);
                }
            else
            if (data?.briq?.material)
                getVoxelWorld(data.briq.material).setVoxel(...data.position, data?.briq?.color || '');
            else
                for (const mat in voxels)
                    voxels[mat].setVoxel(...data.position, '');

        } else if (item.action === 'reset')
            reset();
        else if (item.action === 'set_camera_target')
            orbitControls.controls.target.set(...item.payload.target);
        else if (item.action === 'put_all_in_view') {
            const center = [0, 1, 2].map((i) => (bounds?.min?.[i] + bounds?.max?.[i]) / 2 || 0);
            const distance = Math.max(10, ...[0, 1, 2].map((i) => (bounds?.max?.[i] - bounds?.min?.[i]) || 0));
            camera.position.set(center[0] + distance * 0.35, center[1] + distance * 1.0, center[2] - distance * 1.68);
            orbitControls.controls.target.set(...center);
            orbitControls.controls.update();
        }
    if (dispatchedActions.length) {
        dispatchedActions.length = 0;
        for (const mat in voxels)
            voxels[mat].updateDirty();
        if (bounds.min)
            grid.place(bounds.min[0] - 2, 0, bounds.min[2] - 2, bounds.max[0] - bounds.min[0] + 5, bounds.max[2] - bounds.min[2] + 5)
        else
            grid.place(0, 0, 0, 0, 0)
    }
}

import { ShaderGrid } from './ShaderGrid';

export const grid = new ShaderGrid();