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


import BookletModel from '@/assets/genesis/booklet.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

import DefaultBox from '@/assets/genesis/default_box.png';

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D };
let bookletMesh: THREE.Object3D;

let canvas: HTMLCanvasElement;

let defaultBoxTexture: THREE.Texture;

let sceneBox: THREE.Mesh | undefined;

let briqCubes;

const DEBUG_PHYSICS = false;

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
                resolve({
                    anim: gltf.animations[0],
                    box: gltf.scene.children.slice()[0],
                });
            },
            () => {},
            (error: any) => reject(error),
        );
    });

    const bookletPromise = new Promise<THREE.Object3D>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            BookletModel,
            (gltf: any) => {
                resolve(gltf.scene.children.slice()[0]);
            },
            () => {},
            (error: any) => reject(error),
        );
    });

    // Now create scene items.
    scene = new THREE.Scene();

    /* Create the camera early, because it's needed for the post-processor. */
    const fov = 35;
    const aspect = 2;
    const near = 0.1;
    const far = 10;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    /* Debug */
    const orbitControls = new OrbitControls(camera, canvas);
    orbitControls.enableDamping = true;
    orbitControls.target = new THREE.Vector3(0, 0, 0);

    boxGlb = await boxPromise;
    bookletMesh = await bookletPromise;

    return {
        camera,
        scene,
        render,
    }
}

import { AmmoPhysics, AmmoDebugDrawer } from './AmmoPhysics.js';


const ammoPromise = threeSetupComplete.then(() => AmmoPhysics(THREE));

let physicsWorld: AmmoPhysics;

let debugGeometry;
let debugDrawer;

let boxObject;
export async function setupScene(quality: SceneQuality = SceneQuality.ULTRA) {
    scene.clear();

    physicsWorld = await ammoPromise;


    recreateRenderer(quality);

    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.BasicShadowMap;
    else
        renderer.shadowMap.type = THREE.VSMShadowMap;

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

    scene.fog = new THREE.Fog(new THREE.Color('#ffffff').convertSRGBToLinear(), 2.0, 5.0);
    scene.background = new THREE.Color('#FFFFFF').convertSRGBToLinear();

    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF').convertSRGBToLinear(), 0.1))
    let light: THREE.SpotLight;
    light = new THREE.SpotLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 1.5, 50.0, Math.PI/6, 0.0, 1.0);
    light.position.set(1, 2, -0.5);
    light.shadow.mapSize = new THREE.Vector2(1024, 1024);
    light.shadow.radius = 20;
    light.shadow.camera.far = 5.0;
    //light.shadow.bias = -0.001;
    //light.shadow.normalBias = 0.08;

    light.castShadow = true;
    scene.add(light);

    //scene.add(new THREE.SpotLightHelper(light, new THREE.Color(0xff0000)))

    function initDebug() {
        const DefaultBufferSize = 3 * 1000000;
        const debugVertices = new Float32Array(DefaultBufferSize);
        const debugColors = new Float32Array(DefaultBufferSize);
        debugGeometry = new THREE.BufferGeometry();
        debugGeometry.setAttribute('position', new THREE.BufferAttribute(debugVertices, 3));//.setDynamic(true));
        debugGeometry.setAttribute('color', new THREE.BufferAttribute(debugColors, 3));//.setDynamic(true));
        const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: true });//{ vertexColors: THREE.VertexColors });
        debugMaterial.color = new THREE.Color(0xff0000);
        const debugMesh = new THREE.LineSegments(debugGeometry, debugMaterial);
        debugMesh.frustumCulled = false;
        scene.add(debugMesh);
        debugDrawer = new AmmoDebugDrawer(null, debugVertices, debugColors, physicsWorld.world);
        if (DEBUG_PHYSICS)
            debugDrawer.enable();

        /*setInterval(() => {
            const mode = (debugDrawer.getDebugMode() + 1) % 3;
            debugDrawer.setDebugMode(mode);
        }, 1000);*/
    }
    initDebug();

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry( 3, 1, 3 ),
        new THREE.ShadowMaterial( { color: 0x111111 } ),
    );
    floor.receiveShadow = true;
    floor.position.y = -1;
    scene.add( floor );

    physicsWorld.addMesh(floor, 0.0, 1.5);

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
        if (mesh.material) {
            mesh.material.fog = false;
            mesh.receiveShadow = true;
        }
        if (mesh.material?.name === 'briq_box.001') {
            texturedMat = mesh.material;
            texturedMat.map.anisotropy = 16;
            mesh.castShadow = true;
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

    if (DEBUG_PHYSICS)
        box.traverse(mesh => {
            if (mesh.material?.name) {
                mesh.material.opacity = DEBUG_PHYSICS ? 0.35 : 1.0;
                mesh.material.transparent = true;
            }
        });

    test = sceneBox;

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
        const compoundShape = new physicsWorld.AmmoLib.btCompoundShape();
        const box = new Ammo.btBoxShape(new physicsWorld.AmmoLib.btVector3(0.075, 0.175, 0.225));
        {
            const tt = new Ammo.btTransform();
            tt.setIdentity();
            tt.setOrigin(new Ammo.btVector3(-0.140, 0.0, 0.0))
            compoundShape.addChildShape(
                tt,
                box,
            );
        }
        {
            const tt = new Ammo.btTransform();
            tt.setIdentity();
            tt.setOrigin(new Ammo.btVector3(0.140, 0.0, 0.0))
            compoundShape.addChildShape(
                tt,
                box,
            );
        }
        {
            const tt = new Ammo.btTransform();
            tt.setIdentity();
            tt.setOrigin(new Ammo.btVector3(0, -0.32, 0.0))
            compoundShape.addChildShape(
                tt,
                box,
            );
        }
        {
            const tt = new Ammo.btTransform();
            tt.setIdentity();
            tt.setOrigin(new Ammo.btVector3(0, 0.0, 0.44))
            compoundShape.addChildShape(
                tt,
                box,
            );
        }
        const rbInfo = new physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            0,
            motionState,
            compoundShape,
        );

        const body = new physicsWorld.AmmoLib.btRigidBody(rbInfo);
        body.setActivationState(4); // 4: disable deactivation
        body.setCollisionFlags(2); // 2 is kinematic
        physicsWorld.world.addRigidBody(body);
        test.userData.physicsBody = body;
    }

    return sceneBox;
}

export function generateCubes(colors: any[] = [0xff0000, 0x00ff00, 0x0000ff]) {
    const xcount = DEBUG_PHYSICS ? 3 : 6;
    const ycount = DEBUG_PHYSICS ? 3 : 5;
    const zcount = DEBUG_PHYSICS ? 3 : 6;
    briqCubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.01, 0.01, 0.01, 2, 2, 2), new THREE.MeshStandardMaterial(), xcount*ycount*zcount);
    briqCubes.castShadow = true;
    briqCubes.receiveShadow = true;
    briqCubes.material.fog = false;
    let i = 0;
    for (let x = 0; x < xcount; ++x)
        for (let z = 0; z < zcount; ++z)
            for (let y = 0; y < ycount; ++y) {
                const vec = new THREE.Vector3(
                    x * 0.0105 - xcount * 0.0105 / 2,
                    y * 0.0105 - 0.135,
                    -z * 0.0105 + 0.20,
                );
                vec.applyQuaternion(sceneBox.quaternion);
                vec.add(sceneBox.position)
                briqCubes.setMatrixAt(i, new THREE.Matrix4().setPosition(vec));
                briqCubes.setColorAt(i, new THREE.Color(colors[Math.floor((Math.random()* colors.length))]).convertSRGBToLinear())
                ++i;
            }

    scene.add(briqCubes);
    physicsWorld.addMesh(briqCubes, 0.1);
}

export function generateBooklet() {
    const booklet = bookletMesh.clone();
    booklet.material.fog = false;
    booklet.material.map.anisotropy = 16;
    booklet.castShadow = true;
    booklet.receiveShadow = true;
    const vec = new THREE.Vector3(0, 0, 0);
    vec.applyQuaternion(sceneBox.quaternion);
    vec.add(sceneBox.position)
    booklet.position.set(vec.x, vec.y, vec.z);
    booklet.quaternion.set(sceneBox.quaternion.x, sceneBox.quaternion.y, sceneBox.quaternion.z, sceneBox.quaternion.w);
    booklet.rotateY(Math.PI * 1.04);
    booklet.rotateZ(-Math.PI/2.5);
    scene.add(booklet);
    physicsWorld.addMesh(booklet, 10.0, 0.3);
}

let runPhysics = true;
export function StopPhysics() {
    runPhysics = false;
}

export function graphicsFrame(delta: number) {
    if (debugDrawer) {
        if (debugDrawer.index !== 0) {
            debugGeometry.attributes.position.needsUpdate = true;
            debugGeometry.attributes.color.needsUpdate = true;
        }

        debugGeometry.setDrawRange(0, debugDrawer.index);
    }

    debugDrawer.update()

    if (physicsWorld && runPhysics) {
        physicsWorld.step(delta);

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
}