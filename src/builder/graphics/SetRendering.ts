import { THREE } from '@/three';

import VoxelWorld from './VoxelWorld';

import { camera, orbitControls } from './Builder';

import daylight_Back from '@/assets/skybox/Daylight-Box_Back.jpg'
import daylight_Bottom from '@/assets/skybox/Daylight-Box_Bottom.jpg'
import daylight_Front from '@/assets/skybox/Daylight-Box_Front.jpg'
import daylight_Left from '@/assets/skybox/Daylight-Box_Left.jpg'
import daylight_Right from '@/assets/skybox/Daylight-Box_Right.jpg'
import daylight_Top from '@/assets/skybox/Daylight-Box_Top.jpg'

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
    return texture;
}

import RealmsPic from '@/assets/realms.png';

function generateRealms() {
    const loader = new THREE.TextureLoader();
    return loader.load(RealmsPic);
}

import { THREE_SETUP, GLTFLoader } from '@/three';

import Keystone from '@/assets/keystone-square-uv.glb?url';

const loadKeystoneMesh = (() => {
    let promise = new Promise(async (resolve, reject) => {
        await THREE_SETUP;
        const loader = new GLTFLoader();
        loader.load(Keystone, (gltf: any) => {
            let mesh = gltf.scene.children[0] as unknown as THREE.Mesh;
            mesh.geometry.translate(0.5, 0.5, 0.5);
            resolve(mesh);
        }, () => {}, (error: any) => reject(error));
    }) as Promise<THREE.Mesh>;
    return function() {
        return promise;
    }
})();

var currentSet = "";

var setObject: THREE.Object3D;
var voxWorld: VoxelWorld;

var voxels: { [material: string]: VoxelWorld } = {};
var nfts: { [key: string]: briqNFT } = {};

class briqNFT
{
    id: string;
    mesh: THREE.Mesh;
    position: [number, number, number] | undefined;

    constructor(id: string)
    {
        this.id = id;
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFaa00,
            roughness: 0.5,
            metalness: 0.9,
            envMap: generateSkybox(),
            bumpMap: generateRealms(),
            bumpScale: 0.1,
            roughnessMap: generateRealms(),
        });
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 10, 10, 10), material);
        this.mesh.geometry.translate(0.5, 0.5, 0.5);
        loadKeystoneMesh().then(mesh => this.mesh.geometry = mesh.geometry );
        this.mesh.userData.nft = this.id;
    }

    setPos(position?: [number, number, number])
    {
        let oldPos = this.position?.slice();
        this.position = position;
        if (!oldPos && this.position)
        {
            this.mesh.visible = true;
            this.mesh.position.set(...this.position);
            setObject.add(this.mesh);
        }
        else if (oldPos && !this.position)
        {
            setObject.remove(this.mesh);
        }
        else if (this.position)
            this.mesh.position.set(...this.position);
    }
}

export function getSetObject()
{
    if (setObject)
        return setObject;
    setObject = new THREE.Object3D();
    for (let mat in voxels)
        setObject.add(voxels[mat].object);
    return setObject;
};

export function getIntersectionPos(xScreen: number, yScreen: number)
{
    const x = (xScreen) *  2 - 1;
    const y = (yScreen) * -2 + 1;  // note we flip Y
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    start.setFromMatrixPosition(camera.matrixWorld);
    end.set(x, y, 1).unproject(camera);

    let rc = new THREE.Raycaster();
    rc.setFromCamera({ x, y }, camera);
    let obj = rc.intersectObject(getSetObject(), true);
    if (obj?.[0]?.object?.userData?.nft)
        return {
            position: [obj[0].point.x, obj[0].point.y, obj[0].point.z],
            normal: [obj[0].face?.normal.x, obj[0].face?.normal.y, obj[0].face?.normal.z],
        };
    let closest = undefined;
    let bestD = 0;
    for (let mat in voxels)
    {
        let int = voxels[mat].intersectRay(start, end);
        if (!int)
            continue;
        // TODO: improve
        let d = rc.ray.distanceSqToPoint(new THREE.Vector3(...int.position));
        if (!closest || d < bestD)
        {
            bestD = d;
            closest = int;
        }
    }
    return closest;
}

function reset()
{
    for (let mat in voxels)
        voxels[mat].reset();
    voxels = {};
    for (let id in nfts)
        nfts[id].setPos();
    setObject.clear();
}

export function handleActions(dispatchedActions: Array<{ action: string, payload: any }>)
{
    for (let item of dispatchedActions)
    {
        if (item.action === "select_set")
        {
            reset();
            for (let data of item.payload.briqs)
            {
                if (data.id)
                {
                    if (!(data.id in nfts))
                        nfts[data.id] = new briqNFT(data.id);
                    nfts[data.id].setPos(data.pos);
                }
                else
                {
                    if (!voxels[data.material])
                    {
                        voxels[data.material] = new VoxelWorld({ cellSize: 10 });
                        setObject.add(voxels[data.material].object);
                    }
                    voxels[data.material].setVoxel(...data.pos, data?.color ?? "");
                }
                    
            }
            currentSet = item.payload.setId;
        }
        else if (item.action === "place_briq" || item.action === "remove_briq")
        {
            let data = item.payload;
            if (data.set !== currentSet)
                continue;
            if (data?.briq?.id) // NFT
            {
                if (item.action === "remove_briq")
                    nfts[data.briq.id].setPos();
                else
                {
                    if (!(data.briq.id in nfts))
                        nfts[data.briq.id] = new briqNFT(data.briq.id);
                    nfts[data.briq.id].setPos(data.position);
                }
            }
            else
            {
                if (data.briq && !voxels[data.briq.material])
                {
                    voxels[data.briq.material] = new VoxelWorld({ cellSize: 10 });
                    setObject.add(voxels[data.briq.material].object);
                }
                console.log(data, voxels)
                if (data?.briq?.material)
                    voxels[data.briq.material].setVoxel(...data.position, data?.briq?.color || "");
                else
                    for (let mat in voxels)
                        voxels[mat].setVoxel(...data.position, "");
                let reg = new Set();
            }
        }
        else if (item.action === "reset")
        {
            reset();
        }
        else if (item.action === "set_camera_target")
        {
            orbitControls.controls.target.set(...item.payload.target);
        }
        else if (item.action === "put_all_in_view")
        {
            // TODO
            continue;
            let aabb = voxWorld.getAABB();
            let center = [aabb[0][0] + aabb[1][0], aabb[0][1] + aabb[1][1], aabb[0][2] + aabb[1][2]];
            let bounds = Math.max(aabb[1][0] - aabb[0][0], aabb[1][1] - aabb[0][1], aabb[1][2] - aabb[0][2]);
            bounds = Math.max(5, bounds);
            camera.position.set(bounds * 0.25, bounds * 0.7, -bounds * 1.2);
            orbitControls.controls.target.set(0, center[1]/2, 0);
            orbitControls.controls.update();
        }
    }
    dispatchedActions.length = 0;
    for (let mat in voxels)
        voxels[mat].updateDirty();
}