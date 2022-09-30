import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SSAOPass,
    GammaCorrectionShader,
    OrbitControls,
    SkeletonUtils,
    SMAAPass,
} from '@/three';

import { GLTFLoader } from '@/three';

//import { Ammo } from 'three/addons/physics/AmmoPhysics.js';

import HomeScene from '@/assets/genesis/briqs_box_xmas.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

import DefaultBox from '@/assets/genesis/default_box.png';

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let fireMaterial: THREE.ShaderMaterial;
let chimneyLight: THREE.PointLight;

let roomSceneGlb: THREE.Object3D[];
let boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D };

let canvas: HTMLCanvasElement;

let defaultBoxTexture: THREE.Texture;

let sceneBox: THREE.Mesh | undefined;

let briqCubes;

export enum SceneQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA,
}

export const materials = {} as { [box_name: string]: THREE.Material[] };
export const boxMaterials = {
    default: undefined as unknown as [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial],
    hovered: undefined as unknown as [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial],
    hidden: undefined as unknown as [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial],
};
export const boxTexture = {} as { [box_name: string]: {
    texture: THREE.Texture,
    users: THREE.Mesh[]
}};

function recreateRenderer(quality: SceneQuality) {
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xFF0000, 0);
    // Somehow breaks animations.
    //renderer.info.autoReset = false;

    if (quality >= SceneQuality.MEDIUM) {
        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        };
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, parameters);
        renderTarget.texture.encoding = THREE.sRGBEncoding;
        composer = new EffectComposer(renderer, renderTarget);
    } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
        composer = new EffectComposer(renderer);
    }

    {
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const size = new THREE.Vector2();
        renderer.getSize(size);

        const aoPass = new SSAOPass(scene, camera, size.x, size.y);

        // Overwrite the visibility pass so that the fire material is ignored, or SSAO writes depth.
        /*
        aoPass.overrideVisibility = function() {
            const scene = aoPass.scene;
            const cache = aoPass._visibilityCache;
            scene.traverse(function (object: any) {
                cache.set( object, object.visible );
                if (object.name === 'fire')
                    object.visible = false;
                if(object.parent?.name === 'wooden_logs')
                    object.visible = false;
                if (object.isPoints || object.isLine)
                    object.visible = false;
            });
        }*/

        aoPass.output = SSAOPass.OUTPUT.Default;
        aoPass.kernelRadius = 0.02;
        aoPass.minDistance = 0.001;
        aoPass.maxDistance = 0.02;
        composer.addPass(aoPass);

        const copyPass = new ShaderPass(GammaCorrectionShader);
        composer.addPass(copyPass);

        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.x = 1 / size.x;
        fxaaPass.uniforms['resolution'].value.y = 1 / size.y;
        composer.addPass(fxaaPass);

        const smaaPass = new SMAAPass(200, 200);
        composer.addPass(smaaPass);

    }
    return [renderer, composer];
}

function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        // SSAO
        composer.passes[1].setSize(width, height);

        // FXAA
        composer.passes[3].uniforms['resolution'].value.x = 1 / width;
        composer.passes[3].uniforms['resolution'].value.y = 1 / height;
        // SMAA
        composer.passes[4].setSize(width, height);

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    return needResize;
}

export function render() {
    if (!composer)
        return;
    resizeRendererToDisplaySize();
    composer.render();
    //renderer.info.reset();
}

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    canvas = _canvas;

    // Have to recreate renderer, to update the canvas.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });

    // We only need the rest once.
    if (boxGlb)
        return {
            camera,
            scene,
            render,
        };

    briqCubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.01, 0.01, 0.01, 2, 2, 2), new THREE.MeshStandardMaterial(), 300);
    for (let i = 0; i < 300; ++i) {
        briqCubes.setMatrixAt(i, new THREE.Matrix4().setPosition(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1));
        briqCubes.setColorAt(i, new THREE.Color().setRGB(Math.random(), Math.random(), Math.random()))
    }

    const defaultLoader = new THREE.TextureLoader();
    defaultBoxTexture = defaultLoader.load(DefaultBox, (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        tex.flipY = false;
    });

    const boxPromise = new Promise<{ anim: THREE.AnimationClip, box: THREE.Object3D }>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            BriqBox,
            (gltf: any) => {
                /*
                boxMaterials.default = [
                    gltf.scene.children.slice()[0].children[1].children[0].material.clone(),
                    gltf.scene.children.slice()[0].children[1].children[1].material.clone(),
                ];
                boxMaterials.hovered = [
                    gltf.scene.children.slice()[0].children[1].children[0].material.clone(),
                    gltf.scene.children.slice()[0].children[1].children[1].material.clone(),
                ];
                boxMaterials.hidden = [
                    gltf.scene.children.slice()[0].children[1].children[0].material.clone(),
                    gltf.scene.children.slice()[0].children[1].children[1].material.clone(),
                ];

                boxMaterials.hidden[0].transparent = true;
                boxMaterials.hidden[1].transparent = true;
                boxMaterials.hidden[0].opacity = 0.1;
                boxMaterials.hidden[1].opacity = 0.1;

                boxMaterials.default[0].map = defaultBoxTexture;
                boxMaterials.default[0].map.encoding = THREE.sRGBEncoding;
                boxMaterials.default[0].normalMap!.encoding = THREE.sRGBEncoding;
                boxMaterials.default[0].normalMap!.needsUpdate = true;

                boxMaterials.hovered[0].emissive = new THREE.Color(0xffffff);
                boxMaterials.hovered[0].emissiveMap = defaultBoxTexture;
                boxMaterials.hovered[0].emissiveMap.encoding = THREE.sRGBEncoding;
                boxMaterials.hovered[0].emissiveIntensity = 0.1;
                boxMaterials.hovered[0].needsUpdate = true;
                */
                resolve({
                    anim: gltf.animations[0],
                    box: gltf.scene.children.slice()[0],
                });
            },
            () => {},
            (error: any) => reject(error),
        );
    });
    const roomPromise = new Promise((resolve: (_: THREE.Mesh[]) => void, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            HomeScene,
            (gltf: any) => {
                resolve(gltf.scene.children.slice(1));
            },
            () => {},
            (error: any) => reject(error),
        );
    })

    // Now create scene items.
    scene = new THREE.Scene();

    /* Create the camera early, because it's needed for the post-processor. */
    const fov = 35;
    const aspect = 2;
    const near = 0.1;
    const far = 10;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    /* Debug */
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new THREE.Vector3(0, 0, 0);

    boxGlb = await boxPromise;
    roomSceneGlb = await roomPromise;

    return {
        camera,
        scene,
        render,
    }
}

/*
import * as Ammo2 from 'ammo.js';
globalThis.Ammo = Ammo2;
globalThis.Ammo();
*/
//globalThis.Ammo3 = globalThis.Ammo;
//globalThis.Ammo = async () => globalThis.Ammo3;
//globalThis.Ammo();

import { AmmoPhysics } from './AmmoPhysics.js';


let physicsWorld: AmmoPhysics;

let boxObject;
export async function setupScene(quality: SceneQuality = SceneQuality.ULTRA) {
    scene.clear();

    physicsWorld = await AmmoPhysics();

    recreateRenderer(quality);

    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.BasicShadowMap;
    else
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // SSAO is costly, enable on ultra.
    composer.passes[1].enabled = quality >= SceneQuality.ULTRA;
    // FXAA is fast enough, enable on Medium.
    composer.passes[3].enabled = quality === SceneQuality.MEDIUM;
    // SMAA is better, enable on High onwards.
    composer.passes[4].enabled = quality > SceneQuality.MEDIUM;

    const camzoom = 0.7;
    camera.position.set(camzoom * 1, camzoom * 0.8, camzoom * -1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    scene.background = new THREE.Color('#FFFFFF').convertSRGBToLinear();

    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF').convertSRGBToLinear(), 0.1))
    let light: THREE.Light;
    light = new THREE.PointLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 1.5, 10.0);
    light.position.set(2, 3, -1);
    light.shadow.radius = 12;
    light.shadow.mapSize = new THREE.Vector2(512, 512);

    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.08;
    light.shadow.camera.near = 0.03;
    light.shadow.camera.far = 40;

    light.castShadow = true;
    scene.add(light);


    const floor = new THREE.Mesh(
        new THREE.BoxGeometry( 3, 1, 3 ),
        new THREE.ShadowMaterial( { color: 0x111111 } ),
    );
    floor.receiveShadow = true;
    floor.position.y = -1;
    scene.add( floor );

    physicsWorld.addMesh(floor);

    /*
    physicsWorld = new AmmoPhysics(scene);
    // static ground
    physicsWorld.add.ground({ x: 0, z: 0, y: -1 })

    if (sceneBox) {
        scene.add(sceneBox);
        sceneBox.add(briqCubes);
        physicsWorld.add.existing(sceneBox);
    }
    */

    // Do an initial render pass to precompile shaders.
    composer.render(scene, camera);
}

let test;
export function setBox(boxData: any) {
    const box = SkeletonUtils.clone(boxGlb.box) as THREE.Object3D;

    let texturedMat;
    box.traverse(mesh => {
        if (mesh.material?.name === 'briq_box.001') {
            mesh.material.map.anisotropy = 16;
            texturedMat = mesh.material;
        }
    })
    const mixer = new THREE.AnimationMixer(box);
    const anim = mixer.clipAction(boxGlb.anim)
    anim.timeScale = -2;
    anim.paused = false;
    anim.setLoop(THREE.LoopRepeat, 1);
    anim.play();
    mixer.setTime(0.001);

    box.userData.mixer = mixer;
    box.position.set(...boxData.position);
    box.rotateY(Math.PI);

    box.userData.uid = boxData.uid;
    box.userData.box_token_id = boxData.box_token_id;
    box.userData.box_name = boxData.box_name;

    if (!boxTexture[boxData.box_name])
        boxTexture[boxData.box_name] = {
            texture: defaultBoxTexture,
            users: [box],
        }
    else
        boxTexture[boxData.box_name].users.push(box);



    const defaultLoader = new THREE.TextureLoader();
    defaultLoader.load(boxData.texture, (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        tex.flipY = false;
        texturedMat.map = tex;
    });

    /*
    box.children[1].children[0].castShadow = true;
    box.children[1].children[0].receiveShadow = true;
    box.children[1].children[1].receiveShadow = true;

    box.children[1].children[0].material = boxMaterials.default[0].clone();
    box.children[1].children[1].material = boxMaterials.default[1];

    box.children[1].children[0].material.map = boxTexture[boxData.box_name].texture;
    */
    // Collision detection: for perf reasons we compute against a box.

    // Set an artificial bounding box that'll be big enough
    //box.children[1].children[0].geometry.boundingSphere = new THREE.Sphere(undefined, 1);
    // Reset the AABB because it fails to work properly for skinned meshes.
    //box.children[1].children[0].geometry.boundingBox = null;

    const min = new THREE.Vector3(0.05, -0.07, -0.26)
    const max = new THREE.Vector3(0.55, 0.09, 0.25)
    min.add(box.position);
    max.add(box.position);
    box.userData.bb = new THREE.Box3(min, max);

    sceneBox = box;
    // We need to add it because we're not re-creating the full scene.
    scene.add(sceneBox);
    scene.add(briqCubes);

    test = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.35, 0.45),
        new THREE.MeshBasicMaterial( { color: 0x441111 } ),
    );
    sceneBox.add(test);

    {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const vec = new THREE.Vector3();
        test.getWorldPosition(vec);
        transform.setOrigin(new Ammo.btVector3(vec.x, vec.y, vec.z));
        const quat = new THREE.Quaternion();
        test.getWorldQuaternion(quat);
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        const motionState = new physicsWorld.AmmoLib.btDefaultMotionState(transform);
        const rbInfo = new physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            0,
            motionState,
            new physicsWorld.AmmoLib.btBoxShape(new physicsWorld.AmmoLib.btVector3(0.075, 0.175, 0.225)),
        );
        const body = new physicsWorld.AmmoLib.btRigidBody(rbInfo);
        body.setActivationState(4); // 4: disable deactivation
        body.setCollisionFlags(2); // 2 is kinematic
        physicsWorld.world.addRigidBody(body);
        test.userData.physicsBody = body;
    }

    physicsWorld.addMesh(briqCubes, 1);


    return sceneBox;
}


export function graphicsFrame(delta: number) {
    if (physicsWorld) {
        physicsWorld.step(delta * 0.2);

        const ms = test.userData.physicsBody.getMotionState();
        if ( ms ) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            const vec = new THREE.Vector3();
            test.getWorldPosition(vec);
            transform.setOrigin(new Ammo.btVector3(vec.x, vec.y, vec.z));
            const quat = new THREE.Quaternion();
            test.getWorldQuaternion(quat);
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

            ms.setWorldTransform(transform);
        }
    }
    //if (physicsWorld)
    //physicsWorld.update(delta*100);
}

export function getBoxAt(event: PointerEvent) {
    const rc = new THREE.Raycaster();
    const cv = canvas;
    rc.setFromCamera({ x: event.clientX / cv.clientWidth * 2 - 1.0, y: event.clientY / cv.clientHeight * - 2 + 1.0 }, camera);
    const closest = new THREE.Vector3();
    let bestDistance = undefined;
    let closestBox = undefined;
    for (const box of boxes)
        if (rc.ray.intersectBox(box.userData.bb, closest)) {
            const distance = rc.ray.origin.distanceToSquared(closest);
            if (bestDistance === undefined || distance < bestDistance) {
                bestDistance = distance;
                closestBox = box;
            }
        }
    return closestBox;
}

export function resetGraphics() {
    scene.clear();
    renderer.dispose();
    while (boxes.length)
        boxes.pop();
    //renderer = null;
    //scene = null;
}