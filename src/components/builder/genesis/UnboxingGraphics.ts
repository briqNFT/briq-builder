import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SAOPass,
    CopyShader,
    OrbitControls,
    SkeletonUtils,
} from '@/three';

import { GLTFLoader } from '@/three';

import HomeScene from '@/assets/genesis/briqs_box_xmas.glb?url';
import BriqBox from '@/assets/genesis/briqs_box.glb?url';

export async function useRenderer(canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    let renderer: THREE.Renderer, composer: typeof EffectComposer;

    const scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2;
    const near = 0.01;
    const far = 20;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

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
            composer.passes[1].uniforms['resolution'].value.x = 1 / width;
            composer.passes[1].uniforms['resolution'].value.y = 1 / height;

            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        return needResize;
    }


    function recreateRenderer() {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap; // VSMShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setClearColor(0xF00000, 0);

        composer = new EffectComposer(renderer);
        {
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);

            const copyPass = new ShaderPass(FXAAShader);
            const size = new THREE.Vector2();
            renderer.getSize(size);
            copyPass.uniforms['resolution'].value.x = 1 / size.x;
            copyPass.uniforms['resolution'].value.y = 1 / size.y;
            composer.addPass(copyPass);
        }
        if (true/*builderSettings.useSAO*/) {
            const saoPass = new SAOPass(scene, camera, true, true);
            saoPass.params = {
                output: 0,
                saoBias: 1,
                saoIntensity: 0.1,
                saoScale: 200,
                saoKernelRadius: 40,
                saoMinResolution: 0,
                saoBlur: true,
                saoBlurRadius: 8,
                saoBlurStdDev: 4,
                saoBlurDepthCutoff: 0.01,
            };
            composer.addPass(saoPass);
        }
        /* ThreeJS auto-renders the final pass to the screen directly, which breaks my scene layering. */
        /* Instead, add a manual 'write to screen' pass */
        {
            const copyPass = new ShaderPass(CopyShader);
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


export async function setupScene(scene: THREE.Scene, camera: THREE.Camera) {
    camera.position.set(-2, 1.8, -2);
    camera.lookAt(new THREE.Vector3(2, 0, 2));
    scene.add(camera);

    scene.background = new THREE.Color('#230033');
    scene.add(new THREE.AmbientLight(new THREE.Color('#FFFFFF'), 0.3))
    const light = new THREE.PointLight(new THREE.Color('#FFDDDD'), 1.2, 10.0);
    light.position.set(0.5, 2.25, -1);
    light.shadow.bias = -0.01;
    //light.shadow.blurSamples = 30;
    light.shadow.radius = 1;
    light.shadow.mapSize = new THREE.Vector2(512, 512);
    light.shadow.needsUpdate = true;
    light.castShadow = true;
    scene.add(light);

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
    console.log(meshes);

    const castShadow = (obj: any) => {
        obj.castShadow = true;
        obj.children.forEach(castShadow);
    }

    const receiveShadow = (obj: any) => {
        obj.receiveShadow = true;
        obj.children.forEach(receiveShadow);
    }

    for(const mesh of meshes) {
        if (['fireplace', 'christmas_tree', 'gamecube', 'side_table'].indexOf(mesh.name) !== -1)
            castShadow(mesh);
        if (['room', 'car_rug', 'sofa'].indexOf(mesh.name) !== -1)
            receiveShadow(mesh);
        obj.add(mesh);
    }
    scene.add(obj);
    obj.rotateY(Math.PI);
    obj.translateY(-2.05);
    obj.translateZ(9);

    const chimneyLight = new THREE.PointLight(new THREE.Color('#FFAA00'), 1.5, 6.0);
    chimneyLight.position.set(2.6, 0.4, 0.5);
    chimneyLight.shadow.blurSamples = 30;
    chimneyLight.shadow.bias = -0.01;
    chimneyLight.shadow.radius = 8;
    chimneyLight.shadow.mapSize = new THREE.Vector2(256, 256);
    chimneyLight.castShadow = true;
    console.log(chimneyLight);
    scene.add(chimneyLight);

    const boxGlb = await new Promise<{ anim: THREE.AnimationClip, box: THREE.Object3D }>((resolve, reject) => {
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
    return {
        chimneyLight,
        boxGlb,
    }
}

import DefaultBox from '@/assets/genesis/default_box.png';
export const materials = {} as { [box_name: string]: THREE.Material[] };

export function addBox(boxData: any, scene: THREE.Scene, boxGlb: { anim: THREE.AnimationClip, box: THREE.Object3D }) {
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


    // Collision detection: for perf reasons we compute against a box.
    // TODO: do this much better.

    // Set an artificial bounding box that'll be big enough
    //box.children[1].children[0].geometry.boundingSphere = new THREE.Sphere(undefined, 1);
    // Reset the AABB because it fails to work properly for skinned meshes.
    //box.children[1].children[0].geometry.boundingBox = null;

    const min = new THREE.Vector3(0.05, -0.1, -0.26)
    const max = new THREE.Vector3(0.55, 0.09, 0.25)
    min.add(box.position);
    max.add(box.position);
    box.userData.bb = new THREE.Box3(min, max);
    scene.add(box);
    return box;
}
