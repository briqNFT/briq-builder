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

const boxes = [] as THREE.Mesh[];

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
    renderer.setClearColor(0xF00000, 0);
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

        /*
        const saoPass = new SAOPass(scene, camera, true, true);
        saoPass.params = {
            output: SAOPass.OUTPUT.SAO,
            saoBias: -0.0,
            saoIntensity: 1.0,
            saoScale: 32,
            saoKernelRadius: 30,
            saoMinResolution: 0.005,
            saoBlur: true,
            saoBlurRadius: 6,
            saoBlurStdDev: 3,
            saoBlurDepthCutoff: 0.01,
        };
        composer.addPass(saoPass);
        */

        const aoPass = new SSAOPass(scene, camera, size.x, size.y);

        // Overwrite the visibility pass so that the fire material is ignored, or SSAO writes depth.
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
        }

        aoPass.output = SSAOPass.OUTPUT.Default;
        aoPass.kernelRadius = 0.1;
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
    const fov = 45;
    const aspect = 2;
    const near = 0.5;
    const far = 20;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    /* Debug */
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new THREE.Vector3(2, 0, 2);

    boxGlb = await boxPromise;
    roomSceneGlb = await roomPromise;

    return {
        camera,
        scene,
        render,
    }
}


export async function setupScene(quality: SceneQuality = SceneQuality.HIGH) {
    scene.clear();

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

    camera.position.set(-2, 1.8, -2);
    camera.lookAt(new THREE.Vector3(2, 0, 2));
    scene.add(camera);

    scene.background = new THREE.Color('#230033').convertSRGBToLinear();

    const obj = new THREE.Group();

    const castShadow = (obj: any) => {
        obj.castShadow = true;
        obj.children.forEach(castShadow);
    }

    const receiveShadow = (obj: any) => {
        obj.receiveShadow = true;
        obj.children.forEach(receiveShadow);
    }

    const shouldLambert = (obj: any) => {
        if (quality < SceneQuality.HIGH && obj.name === 'fireplace_inner')
            return true;
        return false;
    };

    const shouldPhong = (obj: any) => {
        if (obj.material.name === 'wooden_floor')
            return quality < SceneQuality.MEDIUM
        return quality < SceneQuality.HIGH;
    }

    const processMaterials = (obj: any) => {
        if (obj.material && shouldLambert(obj)) {
            const newMat = new THREE.MeshLambertMaterial();
            newMat.color = obj.material.color;
            newMat.map = obj.material.map;
            newMat.reflectivity = obj.material.metalness;
            obj.material = newMat;

        } else if (obj.material && shouldPhong(obj)) {
            const newMat = new THREE.MeshPhongMaterial();
            newMat.color = obj.material.color;
            newMat.map = obj.material.map;
            newMat.normalMap = obj.material.normalMap;
            newMat.reflectivity = 0.0;
            newMat.reflectivity = obj.material.metalness;
            newMat.emissive = obj.material.emissive;
            if (obj.material.name === 'wooden_floor') {
                newMat.shininess = 200;
                newMat.specular = new THREE.Color(0x555555);
            } else if (obj.material.name === 'plastic_black' || obj.parent?.name === 'gamecube') {
                newMat.shininess = 30;
                newMat.specular = new THREE.Color(0x666666);
            } else {
                newMat.shininess = obj.material.roughness < 0.2 ? 900 : obj.material.roughness < 0.7 ? 30 : 1;
                newMat.specular = new THREE.Color(0x111111);
            }
            newMat.side = THREE.DoubleSide;
            obj.material = newMat;
        } else if (obj.parent?.name === 'tv' && obj.material.name === 'plastic_black')
            obj.material.side = THREE.DoubleSide;
        if (obj.material?.normalMap)
            (obj.material as THREE.MeshStandardMaterial).normalScale = new THREE.Vector2(1, 1);

        obj.children.forEach(processMaterials);
    }

    const meshes = roomSceneGlb.map(x => x.clone(true));

    const casters = ['fireplace', 'christmas_tree', 'gamecube', 'lamp', 'side_table', 'sofa', 'tv', 'gamecube_controller', 'car_rug'];
    for(const mesh_ of meshes) {
        mesh_.traverse(mesh => {
            if (casters.indexOf(mesh.name) !== -1)
                castShadow(mesh);
            receiveShadow(mesh);
        });
        // Special case: the lamp post mustn't cast shadows or things look crap.
        if (mesh_.name === 'lamp')
            mesh_.children[1].castShadow = false;
        // The christmas tree has a particularly bad edge that makes shadows look weird unless rotated.
        if (mesh_.name === 'christmas_tree')
            mesh_.rotateY(-Math.PI * 0.13);
        processMaterials(mesh_);
        // Remove the dog pouf, too many vertices and annoying.
        if (mesh_.name === 'Torus')
            continue;
        obj.add(mesh_);
    }
    scene.add(obj);
    obj.rotateY(Math.PI);
    obj.translateY(-2.05);
    obj.translateZ(9);

    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF').convertSRGBToLinear(), 0.01))
    let light: THREE.Light;
    if (true) {
        light = new THREE.PointLight(new THREE.Color('#ffffff').convertSRGBToLinear(), quality >= SceneQuality.HIGH ? 0.7 : 0.8, 10.0);
        light.position.set(0.58, 1.02, 2.47);
        light.shadow.radius = 12;
        light.shadow.mapSize = new THREE.Vector2(512, 512);
    } else {
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(0.58, 0, 2.47);
        scene.add(lightTarget);
        light = new THREE.SpotLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 0.7, 20.0, Math.PI / 2.1, 0.2, 0.01);
        light.position.set(0.58, 1.02, 2.47);
        light.target = lightTarget;
        light.shadow.mapSize = new THREE.Vector2(512, 512);
    }
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.08;
    light.shadow.camera.near = 0.03;
    light.shadow.camera.far = 10;

    light.castShadow = true;
    scene.add(light);

    /* Add a secondary support light for the lamp stand. */
    if (quality >= SceneQuality.HIGH) {
        const lightSupport = new THREE.PointLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 0.1, 10.0);
        lightSupport.position.set(0.58, 1.0, 2.47);
        lightSupport.shadow.bias = -0.001;
        lightSupport.shadow.normalBias = 0.05;
        lightSupport.shadow.camera.near = 0.03;
        lightSupport.shadow.camera.far = 10;
        lightSupport.shadow.radius = 16;
        lightSupport.shadow.mapSize = new THREE.Vector2(256, 256);
        lightSupport.castShadow = true;
        scene.add(lightSupport);
    }

    /* Add a small light for the TV. */
    /* Off for now, not sure it adds much.
    if (quality === 'HIGH') {
        const lightSupport = new THREE.SpotLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 0.3, 3.0, Math.PI/3, 0.3, 2.0);
        lightSupport.position.set(1.5, 0.8, -1.2);
        lightSupport.castShadow = false;
        const tvTarget = new THREE.Object3D();
        tvTarget.position.set(0.5, 1.0, 1.0);
        scene.add(tvTarget);
        lightSupport.target = tvTarget;
        scene.add(lightSupport);
        const helper = new THREE.SpotLightHelper(lightSupport, 0xff0000);
        scene.add(helper);
    }
    */

    chimneyLight = new THREE.PointLight(new THREE.Color('#ffaa22').convertSRGBToLinear(), 1.2, 5.0);
    chimneyLight.position.set(2.6, 0.4, 0.5);
    chimneyLight.shadow.bias = -0.001;
    chimneyLight.shadow.normalBias = 0.01;
    chimneyLight.shadow.camera.near = 0.05;
    chimneyLight.shadow.camera.far = 10.0;
    // Massive hack to use linear filtering on shadow map.
    chimneyLight.shadow = new Proxy(chimneyLight.shadow, {
        set(target, prop, value, receiver) {
            if (prop === 'map')
                return Reflect.set(target, prop, new THREE.WebGLRenderTarget(value.width, value.height, {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                }), receiver);

            return Reflect.set(target, prop, value, receiver);
        },
    })
    if (quality === SceneQuality.LOW)
        chimneyLight.shadow.mapSize = new THREE.Vector2(512, 512);
    else {
        chimneyLight.shadow.radius = 16;
        chimneyLight.shadow.mapSize = new THREE.Vector2(512, 512);
    }
    chimneyLight.castShadow = true;
    scene.add(chimneyLight);

    const fire = await fireSource(quality > SceneQuality.MEDIUM);
    const fireSamples = {
        [SceneQuality.LOW]: 2,
        [SceneQuality.MEDIUM]: 4,
        [SceneQuality.HIGH]: 5,
        [SceneQuality.ULTRA]: 5,
    }
    for (let i = 1; i <= fireSamples[quality]; i++) {
        const fire_ = fire.clone();
        fire_.position.set(2.40 + (0.25 / fireSamples[quality]) * i, 0.3 + (i % 2) * 0.02, 0.6 + (i % 2) * 0.05);
        scene.add(fire_);
    }

    for (const box of boxes)
        scene.add(box);

    // Do an initial render pass to precompile shaders.
    const fakeObjs = [
        SkeletonUtils.clone(boxGlb.box),
        SkeletonUtils.clone(boxGlb.box),
        SkeletonUtils.clone(boxGlb.box),
        SkeletonUtils.clone(boxGlb.box),
    ];

    // It's important to compile all states in advance so that the first click on a box is smooth.
    fakeObjs[0].children[1].children[0].material = boxMaterials.default[0];
    fakeObjs[0].children[1].children[1].material = boxMaterials.default[1];
    fakeObjs[1].children[1].children[0].material = boxMaterials.hovered[0];
    fakeObjs[1].children[1].children[1].material = boxMaterials.hovered[1];
    fakeObjs[2].children[1].children[0].material = boxMaterials.hidden[0];
    fakeObjs[2].children[1].children[1].material = boxMaterials.hidden[1];

    scene.add(fakeObjs[0]);
    scene.add(fakeObjs[1]);
    scene.add(fakeObjs[2]);

    composer.render(scene, camera);

    scene.remove(fakeObjs[0]);
    scene.remove(fakeObjs[1])
    scene.remove(fakeObjs[2])
}

export function addBox(boxData: any, scene: THREE.Scene) {
    const box = SkeletonUtils.clone(boxGlb.box);

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

    box.children[1].children[0].castShadow = true;
    box.children[1].children[0].receiveShadow = true;
    box.children[1].children[1].receiveShadow = true;

    box.children[1].children[0].material = boxMaterials.default[0].clone();
    box.children[1].children[1].material = boxMaterials.default[1];

    box.children[1].children[0].material.map = boxTexture[boxData.box_name].texture;
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
    scene.add(box);
    boxes.push(box);
    return box;
}


const fireSource = async function(useSimplex: boolean) {
    const vertexShader = `
    varying vec2 vUv;
    varying vec2 pDelta;
    void main() {
        vUv = uv;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition;
        pDelta.xy = ((modelMatrix * vec4(position, 1.0)).xz - vec2(2.45, 0.6) - position.xz) * 11.0;
    }
    `;

    const fragmentShader = `
    // Simplex 2D noise
    //
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
#if USE_SIMPLEX
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
#else
    uniform sampler2D noiseTex;
    float snoise(vec2 v) {
        float z = texture2D(noiseTex, v * 0.4).g;
        z = (z - 0.7) * 1.5;
        return clamp(z * z, -1.0, 1.0);
    }
#endif

    varying vec2 vUv;
    uniform float time;
    varying vec2 pDelta;
    vec4[12] colors = vec4[12](
        vec4(0.0, 0.0, 0.0, 0.0),
        vec4(15.0, 0.0, 0.0, 20.0) / 255.0,
        vec4(55.0, 0.0, 0.0, 50.0) / 255.0,
        vec4(102.0, 1.0, 0.0, 100.0) / 255.0,
        vec4(161.0, 1.0, 0.0, 130.0) / 255.0,
        vec4(197.0, 20.0, 4.0, 200.0) / 255.0,
        vec4(233.0, 48.0, 5.0, 255.0) / 255.0,
        vec4(249.0, 82.0, 9.0, 255.0) / 255.0,
        vec4(255.0, 147.0, 22.0, 255.0) / 255.0,
        vec4(255.0, 218.0, 60.0, 255.0) / 255.0,
        vec4(266.0, 247.0, 83.0, 255.0) / 255.0,
        vec4(157.0, 231.0, 255.0, 255.0) / 255.0
    );
    void main() {
        vec2 coords = vec2(vUv.x + snoise(vec2(vUv.x, time) + pDelta)/10.0, vUv.y + snoise(vec2(vUv.y, time + 0.2) + pDelta)/10.0);
        float noiseA = snoise(coords * 2.0 + pDelta + vec2(time/3.0, -time*2.5));
        float noiseB = snoise(coords * 3.0 + pDelta + vec2(-time/2.0, -time * 3.9));

        vec3 red = vec3(219.0, 45.0, 33.0)/255.0;
        vec3 yellow = vec3(250.0, 197.0, 25.0)/255.0;
        vec3 white = vec3(224.0, 255.0, 253.0)/255.0;

        float distanceX = (1.0 - 2.0 * abs(vUv.x - 0.5));
        float distanceY = (1.0 - vUv.y);// * (1.0 - vUv.y);
    
        float idxD = (noiseB + 1.0) * distanceX * distanceY * 11.999;
        int idx0 = int(floor(idxD));
        int idx1 = idx0 + 1;
        vec4 col = mix(colors[idx0], colors[idx1], idxD - float(idx0));

        idxD = (noiseA + 1.0) * distanceX * distanceY * 11.999;
        idx0 = int(floor(idxD));
        idx1 = idx0 + 1;
        vec4 col2 = mix(colors[idx0], colors[idx1], idxD - float(idx0));

        //gl_FragColor = vec4(snoise(vUv), snoise(vUv), snoise(vUv), 2.0) * 0.5;//vec4((col + col2) * 1.0);
        //gl_FragColor = vec4(snoise2(vUv), snoise2(vUv), snoise2(vUv), 1.0);
        gl_FragColor = vec4((col + col2) * 1.0);
    }
    `;
    const tex = await new THREE.TextureLoader().loadAsync('data:image/png;base64,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');
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    fireMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            noiseTex: { value: tex },
        },
        defines: {
            USE_SIMPLEX: useSimplex ? 1 : 0,
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const geom = new THREE.PlaneGeometry(0.5, 0.5, 1, 1);
    geom.rotateY(-Math.PI/2);
    const obj = new THREE.Mesh(geom);
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.material = fireMaterial;
    obj.name = 'fire';
    return obj;
}

let lightTime = 0.0;
export function graphicsFrame(delta: number) {
    fireMaterial.uniforms['time'].value += delta;
    lightTime += delta * 12.0;
    const intensity = (Math.sin(2 * lightTime) + Math.sin(Math.PI * lightTime)) / 4.0 + 0.5;
    const xF = (Math.sin(2 * lightTime * 1.2 + 0.24) + Math.sin(Math.PI * lightTime * 0.8 + 5.2)) / 4.0 + 0.5;
    const yF = (Math.sin(2 * lightTime * 1.1 + 2.24) + Math.sin(Math.PI * lightTime * 0.96 + 3.2)) / 4.0 + 0.5;
    const zF = (Math.sin(2 * lightTime * 0.8 + 5.24) + Math.sin(Math.PI * lightTime * 1.1 + 1.2)) / 4.0 + 0.5;

    const randomDisturb = Math.random() - 0.5;

    chimneyLight.position.set(
        2.5 + (xF) * 0.01 * (1 + randomDisturb * 0.02),
        0.5 + (yF) * 0.02 * (1 + randomDisturb * 0.02),
        0.6 + (zF) * 0.02 * (1 + randomDisturb * 0.02),
    );
    chimneyLight.intensity = (intensity + randomDisturb * 0.05) * 0.25 + 0.85;
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