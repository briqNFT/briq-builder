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

import { AmmoPhysics, AmmoDebugDrawer } from './AmmoPhysics.js';
import { APP_ENV } from '@/Meta';

import BookletModel from '@/assets/genesis/booklet.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';
import EnvMapImg from '@/assets/genesis/WhiteRoom.png';
import BoxNormImg from '@/assets/genesis/box_tex_norm.png';

export enum SceneQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA,
}

// Load ammo ASAP
const ammoPromise = threeSetupComplete.then(() => AmmoPhysics(THREE));

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D };
let bookletMesh: THREE.Object3D;

let canvas: HTMLCanvasElement;

let envMapRawTexture: THREE.Texture;
let envMapTexture: THREE.Texture;
let boxNormTexture: THREE.Texture;

let sceneBox: THREE.Mesh;

const DEBUG_PHYSICS = false;

export const sceneData = {
    booklet: undefined as THREE.Mesh | undefined,
    bookletTexture: undefined as undefined | THREE.Texture,
};

let briqCubes: THREE.InstancedMesh;

let physicsWorld: AmmoPhysics;
let debugGeometry;
let debugDrawer;
let runPhysics = true;
let boomTriggered = false;

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
    physicsWorld = (await ammoPromise)();

    canvas = _canvas;

    // Have to recreate renderer, to update the canvas.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });

    // Conceptually, we don't really need to reload what's below, but it leads to a blank scene.
    // I guess the GLB loader keeps a reference to the renderer somehow.
    const defaultLoader = new THREE.TextureLoader();
    const envMapPromise = new Promise<THREE.Texture>(resolve => defaultLoader.load(EnvMapImg, (tex) => {
        envMapRawTexture = tex;
        resolve(envMapRawTexture);
    }));

    boxNormTexture = defaultLoader.load(BoxNormImg, (tex) => {
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
    const fov = 40;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    /* Debug */
    if (APP_ENV === 'dev') {
        const orbitControls = new OrbitControls(camera, canvas);
        orbitControls.enableDamping = true;
        orbitControls.target = new THREE.Vector3(0, 0, 0);
    }

    boxGlb = await boxPromise;
    bookletMesh = await bookletPromise;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    envMapTexture = pmremGenerator.fromEquirectangular(await envMapPromise).texture;

    return {
        camera,
        scene,
        render,
    }
}

export async function setupScene(quality: SceneQuality = SceneQuality.ULTRA) {
    scene.clear();

    runPhysics = true;
    boomTriggered = false;

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

    scene.fog = new THREE.Fog(new THREE.Color('#ffffff').convertSRGBToLinear(), 1.3, 4.5);
    // scene.background = new THREE.Color('#FF0000').convertSRGBToLinear();

    scene.environment = envMapTexture;
    scene.background = envMapTexture;

    //scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF').convertSRGBToLinear(), 0.1))
    {
        let light: THREE.SpotLight;
        light = new THREE.SpotLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 1.0, 50.0, Math.PI/6, 0.5, 1.0);
        light.position.set(1, 2, -0.5);
        light.shadow.mapSize = new THREE.Vector2(1024, 1024);
        light.shadow.radius = 20;
        light.shadow.blurSamples = 10;
        light.shadow.camera.far = 5.0;
        light.shadow.bias = -0.004;
        //light.shadow.normalBias = 0.08;

        const map = new THREE.WebGLRenderTarget(1024, 1024, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,

        });
        map.texture.name = light.name + '.shadowMap';
        light.shadow.map = map;

        light.castShadow = true;
        scene.add(light);
        //scene.add(new THREE.SpotLightHelper(light, new THREE.Color(0xff0000)))
    }

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(20, 1, 20),
    );
    floor.receiveShadow = true;
    floor.position.y = -1;
    const material = new THREE.ShadowMaterial( { color: 0xaaaaaa } );
    material.fog = false;
    material.blending = THREE.MultiplyBlending;
    // Make sure that everything blends correctly, and also that the shadows vanish in the distance.
    material.onBeforeCompile = shader => {
        shader.vertexShader = 'varying vec3 _pos;' + '\n' + shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
_pos = worldPosition.xyz;`)
        shader.fragmentShader = 'varying vec3 _pos;' + '\n' + shader.fragmentShader.replace('gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );',
            'gl_FragColor = vec4(clamp(vec3(mix(0.0, 1.0, getShadowMask() * 0.4 + 0.6 + length(_pos.xz) / 5.0)), 0.0, 1.0), 1.0);')
        return shader;
    }
    floor.material = material;
    scene.add( floor );
    physicsWorld.addMesh(floor, 0.0, 1.5);

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

    // Do an initial render pass to precompile shaders.
    composer.render(scene, camera);
}

export async function setBox(boxData: any) {
    const box = SkeletonUtils.clone(boxGlb.box) as THREE.Object3D;

    let texturedMat: THREE.MeshPhysicalMaterial;
    box.traverse(mesh => {
        if (mesh.material) {
            mesh.material.fog = false;
            mesh.receiveShadow = true;
        }
        if (mesh.material?.name === 'briq_box.001') {
            mesh.castShadow = true;
            texturedMat = new THREE.MeshPhysicalMaterial();
            texturedMat.fog = false;
            mesh.material = texturedMat;
        }
    })

    // Load the texture and update it
    const defaultLoader = new THREE.TextureLoader();
    const texturePromise = new Promise((resolve) =>
        defaultLoader.load(boxData.texture, (tex) => {
            tex.encoding = THREE.sRGBEncoding;
            tex.flipY = false;
            texturedMat.map = tex;
            texturedMat.map.anisotropy = 4;
            texturedMat.normalMap = boxNormTexture;
            texturedMat.normalMap.anisotropy = 8;
            texturedMat.normalMap.encoding = THREE.LinearEncoding;
            texturedMat.envMap = envMapTexture;
            texturedMat.envMapIntensity = 0.6;
            texturedMat.metalness = 0.0;
            texturedMat.roughness = 0.24;
            texturedMat.specularIntensity = 0.15;
            resolve(tex);
        }),
    );

    const bookletTexturePromise = new Promise((resolve) =>
        defaultLoader.load(boxData.bookletTexture, (tex: THREE.Texture) => {
            tex.encoding = THREE.sRGBEncoding;
            tex.flipY = false;
            tex.anisotropy = 4;
            resolve(tex);
        }),
    );

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

    {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const vec = new THREE.Vector3();
        sceneBox.getWorldPosition(vec);
        transform.setOrigin(new Ammo.btVector3(vec.x, vec.y, vec.z));
        const quat = new THREE.Quaternion();
        sceneBox.getWorldQuaternion(quat);
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
        sceneBox.userData.physicsBody = body;
    }

    await texturePromise;
    sceneData.bookletTexture = await bookletTexturePromise;

    return sceneBox;
}

export function generateCubes(colors: any[] = [0xff0000, 0x00ff00, 0x0000ff]) {
    const xcount = DEBUG_PHYSICS ? 3 : 4;
    const ycount = DEBUG_PHYSICS ? 3 : 6;
    const zcount = DEBUG_PHYSICS ? 3 : 5;
    briqCubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.015, 0.015, 0.015, 1, 1, 1), new THREE.MeshStandardMaterial(), xcount*ycount*zcount);
    briqCubes.castShadow = true;
    briqCubes.receiveShadow = true;
    const material = briqCubes.material as THREE.MeshStandardMaterial;
    material.fog = false;
    material.metalness = 0.1;
    material.roughness = 0.02;
    material.envMap = envMapTexture;
    material.envMapIntensity = 0.6;

    let i = 0;
    for (let x = 0; x < xcount; ++x)
        for (let z = 0; z < zcount; ++z)
            for (let y = 0; y < ycount; ++y) {
                const vec = new THREE.Vector3(
                    x * 0.016 - xcount * 0.0105 / 2,
                    y * 0.025 - 0.135,
                    -z * 0.018 + 0.10,
                );
                vec.applyQuaternion(sceneBox.quaternion);
                vec.add(sceneBox.position)
                briqCubes.setMatrixAt(i, new THREE.Matrix4().setPosition(vec));
                briqCubes.setColorAt(i, new THREE.Color(colors[Math.floor((Math.random()* colors.length))]).convertSRGBToLinear())
                ++i;
            }
    scene.add(briqCubes);
    physicsWorld.addMesh(briqCubes, 0.1);
    const bodies = physicsWorld.meshMap.get(briqCubes)
    for (const body of bodies) {
        const vec = new THREE.Vector3(0, -0.03, -0.03);
        vec.applyQuaternion(sceneBox.quaternion);
        body.applyCentralImpulse(new Ammo.btVector3(vec.x, vec.y, vec.z));
        body.applyTorqueImpulse(new Ammo.btVector3(Math.random() / 10000.0, Math.random() / 10000.0, Math.random() / 10000.0));
    }
}

export function generateBooklet() {
    const booklet = bookletMesh.clone();
    booklet.material.fog = false;
    booklet.material.map = sceneData.bookletTexture;
    booklet.material.map.anisotropy = 8;
    booklet.material.metalness = 0.02;
    booklet.material.roughness = 0.3;
    booklet.material.envMap = envMapTexture;
    booklet.material.envMapIntensity = 0.6;

    booklet.castShadow = true;
    booklet.receiveShadow = true;
    let vec = new THREE.Vector3(0.03, 0, 0.1);
    vec.applyQuaternion(sceneBox.quaternion);
    vec.add(sceneBox.position)
    booklet.position.set(vec.x, vec.y, vec.z);
    booklet.quaternion.set(sceneBox.quaternion.x, sceneBox.quaternion.y, sceneBox.quaternion.z, sceneBox.quaternion.w);
    booklet.rotateY(Math.PI * 1);
    booklet.rotateZ(-Math.PI/2);
    scene.add(booklet);
    sceneData.booklet = booklet;

    physicsWorld.addMesh(booklet, 10.0, 0.3);
    const body = physicsWorld.meshMap.get(booklet);
    vec = new THREE.Vector3(0, 0.0, -1.5);
    vec.applyQuaternion(sceneBox.quaternion);
    body.applyCentralImpulse(new Ammo.btVector3(vec.x, vec.y, vec.z));
    //runPhysics = false;
}

export function StopPhysics() {
    physicsWorld.world.removeCollisionObject(physicsWorld.meshMap.get(sceneData.booklet));
    const bodies = physicsWorld.meshMap.get(briqCubes)
    for (const body of bodies)
        physicsWorld.world.removeCollisionObject(body)

    //runPhysics = false;
}

export function triggerBoom() {
    if (boomTriggered)
        return;
    boomTriggered = true;

    // Push the booklet to fall right-side up.
    const bookletBody = physicsWorld.meshMap.get(sceneData.booklet);
    bookletBody.applyImpulse(new Ammo.btVector3(-0.1, 0.0, 0.0), new Ammo.btVector3(0.0, 1.0, 0.0));

    const bodies = physicsWorld.meshMap.get(briqCubes)
    for (const body of bodies) {
        const pos = body.getWorldTransform().getOrigin();
        let impulse = new Ammo.btVector3(pos.x() - sceneData.booklet.position.x, 0.2, pos.z() - sceneData.booklet.position.z);
        const dist = impulse.length();
        impulse.normalize();
        const force = Math.max(0, 0.5 - dist) + Math.random() / 7;
        impulse = impulse.op_mul(force * force / 3);
        body.applyCentralImpulse(impulse);
    }

    // Change the collision of the box so that it falls correctly.
    physicsWorld.world.removeCollisionObject(sceneBox.userData.physicsBody);
    physicsWorld.addMesh(sceneBox, 5.0, 0.7);
    const body = physicsWorld.meshMap.get(sceneBox);
    body.applyCentralImpulse(new Ammo.btVector3(-4.0, 0.8, -4.0));
    body.applyTorqueImpulse(new Ammo.btVector3(-0.8, -0.2, 0.4));
}

export function graphicsFrame(delta: number) {
    if (debugDrawer) {
        if (debugDrawer.index !== 0) {
            debugGeometry.attributes.position.needsUpdate = true;
            debugGeometry.attributes.color.needsUpdate = true;
        }

        debugGeometry.setDrawRange(0, debugDrawer.index);
        debugDrawer.update()
    }
    if (physicsWorld && runPhysics) {
        physicsWorld.step(delta);

        // Keep the box collision objects aligned to the box.
        const ms = sceneBox.userData.physicsBody.getMotionState();
        if ( ms ) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            const vec = new THREE.Vector3();
            sceneBox.getWorldPosition(vec);
            transform.setOrigin(new Ammo.btVector3(vec.x, vec.y, vec.z));
            const quat = new THREE.Quaternion();
            sceneBox.getWorldQuaternion(quat);
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

            ms.setWorldTransform(transform);
        }
    }
}

export function resetGraphics() {
    scene.clear();
    renderer.dispose();
}