import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SAOPass,
    SSAOPass,
    GammaCorrectionShader,
    OrbitControls,
    SkeletonUtils,
} from '@/three';

import { GLTFLoader } from '@/three';

import HomeScene from '@/assets/genesis/briqs_box_xmas.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

let scene: THREE.Scene;
let camera: THREE.Camera;

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let fireMaterial: THREE.ShaderMaterial;
let chimneyLight: THREE.PointLight;

let boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D };

let canvas: HTMLCanvasElement;

const boxes = [] as THREE.Mesh[];

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    canvas = _canvas;

    scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2;
    const near = 0.5;
    const far = 20;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    /* Debug */
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new THREE.Vector3(2, 0, 2);

    function resizeRendererToDisplaySize() {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            composer.setSize(width, height);

            // FXAA
            composer.passes[2].uniforms['resolution'].value.x = 1 / width;
            composer.passes[2].uniforms['resolution'].value.y = 1 / height;

            // SSAO
            composer.passes[1].setSize(width, height);

            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        return needResize;
    }


    function recreateRenderer() {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0xF00000, 0);
        composer = new EffectComposer(renderer);
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
                scene.traverse( function ( object ) {
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
            aoPass.minDistance = 0.005;
            aoPass.maxDistance = 0.02;
            composer.addPass(aoPass);

            const copyPass = new ShaderPass(FXAAShader);
            copyPass.uniforms['resolution'].value.x = 1 / size.x;
            copyPass.uniforms['resolution'].value.y = 1 / size.y;
            composer.addPass(copyPass);

            console.log(size);
        }
        {
            /* ThreeJS auto-renders the final pass to the screen directly, which breaks my scene layering. */
            /* Instead, add a manual 'write to screen' pass */
            const copyPass = new ShaderPass(GammaCorrectionShader);
            composer.addPass(copyPass);
        }
        //resizeRendererToDisplaySize(renderer, composer, camera);
        return [renderer, composer];
    }

    function render() {
        resizeRendererToDisplaySize();
        composer.render();
    }

    recreateRenderer();

    return {
        camera,
        scene,
        render,
    }
}


export async function setupScene(quality: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH') {
    scene.clear();

    /*
    renderer.shadowMap.type = {
        'LOW': THREE.PCFShadowMap,
        'MEDIUM': THREE.PCFShadowMap,
        'HIGH': THREE.PCFShadowMap,
    }[quality];
    renderer.shadowMap.needsUpdate = true;*/

    if (quality === 'LOW') {
        composer.passes[1].enabled = false;
        composer.passes[2].enabled = false;
    } else if (quality === 'MEDIUM') {
        composer.passes[1].enabled = false;
        composer.passes[2].enabled = true;
    } else {
        composer.passes[1].enabled = true;
        composer.passes[2].enabled = true;
    }

    camera.position.set(-2, 1.8, -2);
    camera.lookAt(new THREE.Vector3(2, 0, 2));
    scene.add(camera);

    scene.background = new THREE.Color('#230033').convertSRGBToLinear();

    const meshes = await new Promise((resolve: (_: THREE.Mesh[]) => void, reject) => {
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
        if (quality === 'LOW' && obj.name === 'car_rug')
            return true;
        return false;
    };

    const shouldPhong = (obj: any) => {
        if (obj.name === 'Plane003_1' || obj.name === 'car_rug')
            return false;
        if (obj.parent.name === 'gamecube')
            return false;
        if (obj.parent.name === 'tv' && obj.material.name === 'plastic_black')
            return false;
        return quality !== 'HIGH';
    }

    const processMaterials = (obj: any) => {
        if (obj.material && shouldPhong(obj)) {
            const newMat = new THREE.MeshPhongMaterial();
            newMat.color = obj.material.color;
            newMat.map = obj.material.map;
            newMat.reflectivity = obj.material.metalness;
            newMat.emissive = obj.material.emissive;
            newMat.shininess = obj.material.roughness > 0.5 ? 120 : 10;
            newMat.side = THREE.DoubleSide;
            obj.material = newMat;
        } else if (obj.material && shouldLambert(obj)) {
            const newMat = new THREE.MeshLambertMaterial();
            newMat.color = obj.material.color;
            newMat.map = obj.material.map;
            newMat.reflectivity = obj.material.metalness;
            obj.material = newMat;

        } else if (obj.parent.name === 'tv' && obj.material.name === 'plastic_black')
            obj.material.side = THREE.DoubleSide;
        obj.children.forEach(processMaterials);
    }

    console.log(meshes);

    // Torus_1 is the dog pouf
    const casters = ['fireplace', 'christmas_tree', 'gamecube', 'lamp', 'side_table', 'sofa', 'tv', 'gamecube_controller', 'Torus_1'];
    for(const mesh_ of meshes) {
        mesh_.traverse(mesh => {
            if (casters.indexOf(mesh.name) !== -1)
                castShadow(mesh);
            if (true || ['room', 'car_rug', 'sofa', 'fireplace', 'christmas_tree'].indexOf(mesh.name) !== -1)
                receiveShadow(mesh);
        });
        // Special case: the lamp mast mustn't cast shadows or things look crap.
        if (mesh_.name === 'lamp')
            mesh_.children[1].castShadow = false;
        // The christmas tree has a particularly bad edge tha tmakes shadows look weird unless rotated.
        if (mesh_.name === 'christmas_tree')
            mesh_.rotateY(-Math.PI * 0.13);
        processMaterials(mesh_);
        obj.add(mesh_);
    }
    scene.add(obj);
    obj.rotateY(Math.PI);
    obj.translateY(-2.05);
    obj.translateZ(9);

    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF').convertSRGBToLinear(), 0.01))
    let light: THREE.Light;
    if (true) {
        light = new THREE.PointLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 0.7, 10.0);
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
    light.shadow.normalBias = 0.1;
    light.shadow.camera.near = 0.03;
    light.shadow.camera.far = 10;

    light.castShadow = true;
    light.shadow.needsUpdate = true;
    scene.add(light);

    /* Add a secondary support light for the lamp stand. */
    if (quality === 'HIGH') {
        const lightSupport = new THREE.PointLight(new THREE.Color('#ffffff').convertSRGBToLinear(), 0.1, 10.0);
        lightSupport.position.set(0.58, 1.0, 2.47);
        lightSupport.shadow.bias = -0.001;
        lightSupport.shadow.normalBias = 0.1;
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
    chimneyLight.shadow.blurSamples = 30;
    chimneyLight.shadow.bias = -0.001;
    chimneyLight.shadow.normalBias = 0.1;
    chimneyLight.shadow.camera.near = 0.05;
    chimneyLight.shadow.camera.far = 10.0;
    if (quality === 'LOW') {
        chimneyLight.shadow.radius = 8;
        chimneyLight.shadow.mapSize = new THREE.Vector2(256, 256);
    } else {
        chimneyLight.shadow.radius = 16;
        chimneyLight.shadow.mapSize = new THREE.Vector2(512, 512);
    }
    chimneyLight.castShadow = true;
    scene.add(chimneyLight);

    const fire = fireSource();
    for (let i = 0; i < 5; i++) {
        const fire_ = fire.clone();
        fire_.position.set(2.45 + 0.05 * i, 0.3 + i % 2 * 0.02, 0.6 + i % 2 * 0.05);
        scene.add(fire_);
    }

    boxGlb = await new Promise<{ anim: THREE.AnimationClip, box: THREE.Object3D }>((resolve, reject) => {
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
    })
}

import DefaultBox from '@/assets/genesis/default_box.png';
export const materials = {} as { [box_name: string]: THREE.Material[] };

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
    box.children[1].children.forEach(x => {
        x.castShadow = true;
        x.receiveShadow = true;
    });

    const defaultLoader = new THREE.TextureLoader();
    const defaultTexture = defaultLoader.load(DefaultBox);
    defaultTexture.encoding = THREE.sRGBEncoding;
    defaultTexture.flipY = false;

    box.children[1].children[0].material = box.children[1].children[0].material.clone();
    box.children[1].children[1].material = box.children[1].children[1].material.clone();

    box.children[1].children[0].material.color = new THREE.Color('#ffffff');
    box.children[1].children[1].material.color = new THREE.Color('#ffffff');

    (box.children[1].children[0].material.map as THREE.Texture) = defaultTexture;
    if (!materials[boxData.box_name])
        materials[boxData.box_name] = [];
    materials[boxData.box_name].push(box.children[1].children[0].material);

    (box.children[1].children[0].material as THREE.MeshStandardMaterial).normalMap.encoding = THREE.sRGBEncoding;
    (box.children[1].children[0].material as THREE.MeshStandardMaterial).normalMap.needsUpdate = true;

    (box.children[1].children[0].material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
    (box.children[1].children[1].material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
    (box.children[1].children[0].material as THREE.MeshStandardMaterial).emissiveMap = defaultTexture;
    (box.children[1].children[1].material as THREE.MeshStandardMaterial).emissiveMap = defaultTexture;
    (box.children[1].children[0].material as THREE.MeshStandardMaterial).needsUpdate = true;
    (box.children[1].children[1].material as THREE.MeshStandardMaterial).needsUpdate = true;

    // Collision detection: for perf reasons we compute against a box.
    // TODO: do this much better.

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


const fireSource = function() {
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

        gl_FragColor = vec4((col + col2) * 1.0);
    }
    `;
    fireMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
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

