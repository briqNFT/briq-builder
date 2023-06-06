import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    SSAOPass,
    GammaCorrectionShader,
    SMAAPass,
} from '@/three';
import EnvMapImg from '@/assets/genesis/WhiteRoom.png';

export class HighQualityScreenshot {
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;

    defaultCamera = false;
    renderer!: THREE.WebGLRenderer;
    composer: EffectComposer;

    object: THREE.Object3D;
    width: number;
    height: number;

    constructor(object: THREE.Object3D, width: number, height: number) {
        this.object = object.clone(true);
        this.width = width;
        this.height = height;
    }

    async takeScreenshot(camera?: THREE.Camera) {
        await threeSetupComplete;

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        // Have to recreate renderer, to update the canvas.
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
        if (camera)
            this.camera = camera.clone();
        else {
            this.defaultCamera = true;
            const bounds = new THREE.Box3().expandByObject(this.object, true);
            this.object.position.set(...['x', 'y', 'z'].map(i => -(bounds.max[i] + bounds.min[i])/2));
            const size = new THREE.Vector3();
            bounds.getSize(size);
            const camSize = size.length() / 2.4;
            const cam = new THREE.OrthographicCamera(-camSize, camSize, camSize * 4/3, -camSize * 4/3, 1, 500);
            cam.position.set(-37, 17, 47);
            cam.lookAt(new THREE.Vector3(0, 0, 0))
            this.camera = cam;
        }
        await this.setupScene();
        this.recreateRenderer();
        await this.render();
        const result = canvas.toDataURL();
        this.renderer.dispose();
        this.scene.clear();
        return result;
    }

    recreateRenderer() {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.shadowMap.needsUpdate = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0xFF0000, 0);
        // Somehow breaks animations.
        //renderer.info.autoReset = false;

        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType,
        };
        const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, parameters);
        renderTarget.texture.encoding = THREE.sRGBEncoding;
        this.composer = new EffectComposer(this.renderer, renderTarget);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const size = new THREE.Vector2();
        this.renderer.getSize(size);

        const aoPass = new SSAOPass(this.scene, this.camera, size.x, size.y);
        aoPass.enabled = true;
        aoPass.output = SSAOPass.OUTPUT.Default;
        aoPass.kernelRadius = 0.02;
        aoPass.minDistance = 0.001;
        aoPass.maxDistance = 0.02;
        this.composer.addPass(aoPass);

        const copyPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(copyPass);

        const smaaPass = new SMAAPass(this.width, this.height);
        smaaPass.enabled = true;
        this.composer.addPass(smaaPass);
    }

    resizeRendererToDisplaySize() {
        const { camera, renderer, composer } = this;
        const canvas = renderer.domElement;
        const width = canvas.width;
        const height = canvas.height;

        renderer.setSize(width, height, false);
        composer.setSize(width, height);

        // SSAO
        composer.passes[1].setSize(width, height);

        // SMAA
        composer.passes[3].setSize(width, height);

        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    }

    async render() {
        this.resizeRendererToDisplaySize();
        await new Promise((res) => {
            setTimeout(() => {
                this.composer.render();
                res(null);
            }, 0);
        });
    }


    async setupScene() {
        // I guess the GLB loader keeps a reference to the renderer somehow.
        let envMapRawTexture: THREE.Texture;
        const defaultLoader = new THREE.TextureLoader();
        const envMapPromise = new Promise<THREE.Texture>(resolve => defaultLoader.load(EnvMapImg, (tex) => {
            envMapRawTexture = tex;
            resolve(envMapRawTexture);
        }));
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMapTexture = pmremGenerator.fromEquirectangular(await envMapPromise).texture;

        this.scene = new THREE.Scene();

        if (!this.defaultCamera)
            this.scene.add(new THREE.AmbientLight(new THREE.Color(0xFFFFFF), 0.4));

        const light = new THREE.DirectionalLight(new THREE.Color(0xFFFFFF), 0.7);
        light.position.set(this.defaultCamera ? -10 : 10, 20, 30);
        light.castShadow = true;
        light.shadow.bias = -0.0001;
        light.shadow.normalBias = 0.001;
        light.shadow.camera.near = 1.0;
        light.shadow.camera.far = 100;
        light.shadow.camera.left = -20;
        light.shadow.camera.right = 20;
        light.shadow.camera.bottom = -20;
        light.shadow.camera.top = 20;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;

        this.scene.add(light);
        this.object.traverse(mesh => {
            mesh.receiveShadow = true;
            if (mesh?.material) {
                mesh.material = mesh.material.clone();
                mesh.material.envMap = envMapTexture;
                mesh.material.envMapIntensity = this.defaultCamera ? 0.5 : 0.2;
            }

            if (mesh?.material?.lightMapIntensity)
                mesh.material.lightMapIntensity = 0.0;
        })
        this.scene.add(this.object);
        //this.scene.add(this.camera);
    }
}
