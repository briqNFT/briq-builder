import { backendManager } from '@/Backend';
import {
    THREE,
} from '@/three';
import { GLTFLoader } from '@/three';

export async function updateScene(scene: THREE.Scene) {
    const bookletPromise = new Promise<THREE.Mesh>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            backendManager.getRoute('model/starknet-mainnet/0xcafe.glb'),
            (gltf: any) => {
                resolve(gltf.scene.children.slice()[0]);
            },
            () => {},
            (error: any) => reject(error),
        );
    });

    scene.children[1].remove(scene.children[1].children.find(x => x.name === 'christmass_ball_starknet')!);
    scene.children[1].remove(scene.children[1].children.find(x => x.name === 'christmass_ball_silver')!);
    scene.children[1].remove(scene.children[1].children.find(x => x.name === 'christmass_ball_red')!);
    scene.children[1].remove(scene.children[1].children.find(x => x.name === 'christmas_tree_trunk')!);

    const ct = scene.children[1].children.find(x => x.name === 'christmas_tree')!;
    const newCT = await bookletPromise;
    newCT.position.set(...ct.position.toArray());
    newCT.traverse(m => m.geometry && m.geometry.scale(0.25, 0.25, 0.25));
    //newCT.scale.set(0.25, 0.25, 0.25);
    newCT.position.add(new THREE.Vector3(0.3, -0.4, -0.2));
    newCT.rotateY(Math.PI/12);
    newCT.traverse(m => m.castShadow = true);
    newCT.traverse(m => {
        console.log(m)
        m.receiveShadow = true;
        if (m.geometry)
            m.geometry.computeVertexNormals();
        if (m.material)
            m.material.shadowSide = THREE.FrontSide;
    });
    scene.children[1].add(newCT);
    scene.children[1].remove(ct);
}
