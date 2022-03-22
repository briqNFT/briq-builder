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

var currentSet = "";

var setObject: THREE.Object3D;
var voxWorld: VoxelWorld;

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
        let p = this.mesh.geometry.attributes.position;
        for (let i = 0; i < p.count; ++i)
        {
            let prandc = (p.getX(i) % 0.3) + (p.getY(i) % 0.1 )+ (p.getZ(i) % 0.2);
            p.setXYZ(i, p.getX(i) + prandc / 10.0 - 0.03, p.getY(i) + prandc / 10.0 - 0.03, p.getZ(i) + prandc / 10.0 - 0.03);
        }
        this.mesh.geometry.computeVertexNormals();
        p.needsUpdate = true;
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
    voxWorld = new VoxelWorld({
        cellSize: 10,
    });
    setObject = new THREE.Object3D();
    setObject.add(voxWorld.object);
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
    return voxWorld.intersectRay(start, end);
}

function reset()
{
    voxWorld.reset();
    for (let id in nfts)
        nfts[id].setPos();
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
                    voxWorld.setVoxel(...data.pos, data?.color ?? "");
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
                voxWorld.setVoxel(...data.position, data?.briq?.color || "");
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
    voxWorld.updateDirty();
}