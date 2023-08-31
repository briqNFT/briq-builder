import {
    threeSetupComplete,
    THREE,
    EffectComposer,
    RenderPass,
    ShaderPass,
    FXAAShader,
    SSAOPass,
    GammaCorrectionShader,
    SMAAPass,
} from '@/three';

import { GLTFLoader, EXRLoader } from '@/three';

import EnvMapImg2 from '@/assets/industrial_sunset_02_puresky_1k.exr';

import type { Game, Powerup, BriqoutBriq } from 'briqout';

import { backendManager } from '@/Backend';
import { APP_ENV } from '@/Meta';

let envMapTexture: THREE.Texture;

export enum SceneQuality {
    LOW,
    MEDIUM,
    HIGH,
    ULTRA,
}

let canvas: HTMLCanvasElement;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let initialised = false;

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;
    initialised = true;

    canvas = _canvas;

    if (renderer)
        renderer.dispose();

    // Recreate the renderer, because the canvas may need updating.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Conceptually, we don't really need to reload what's below, but it leads to a blank scene.
    // I guess the GLB loader keeps a reference to the renderer somehow.
    const defaultLoader = new THREE.TextureLoader();

    let envMapRawTexture: THREE.Texture;
    const envMapPromise = new Promise<THREE.Texture>(resolve => new EXRLoader().load(EnvMapImg2, function ( texture, textureData ) {
        resolve(texture);
    }));

    /* Create these early, they're needed to create the composer */
    scene = new THREE.Scene();
    const fov = 30;
    const aspect = 2;
    const near = 100.0;
    const far = 10000.0;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(80, 30, 80);
    camera.lookAt(new THREE.Vector3(20, 0, 20));

    // Resolve envmap promise.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    envMapTexture = pmremGenerator.fromEquirectangular(await envMapPromise).texture;
}

function recreateComposer(quality: SceneQuality) {
    if (quality >= SceneQuality.MEDIUM) {
        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType,
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

export function render(delta: number) {
    if (!composer)
        return;
    resizeRendererToDisplaySize();
    composer.render();
    //renderer.info.reset();
}

let paddleObject = undefined;
let ballObject = undefined;

let gameItems = {};

function resetScene(quality: SceneQuality) {
    paddleObject = undefined;
    ballObject = undefined;

    gameItems = {};

    scene.clear();

    recreateComposer(quality);

    renderer.shadowMap.enabled = true;
    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.PCFShadowMap;
    else
        renderer.shadowMap.type = THREE.PCFShadowMap;
}

export function setupScene(game: Game, quality: SceneQuality) {
    resetScene(quality);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(game.width, game.height), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    floor.rotateX(-Math.PI / 2);
    floor.position.y = -20;
    floor.position.x = game.width / 2;
    floor.position.z = game.height / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const light = new THREE.DirectionalLight(0xffffff, 2.0);
    light.position.set(game.width / 2, 1000, game.height / 2);
    light.target.position.set(game.width / 2, 0, game.height / 2);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.left = -1000;
    light.shadow.camera.right = 1000;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.near = 10.0; // default
    light.shadow.camera.far = 200; // default
    scene.add(light);

    camera.position.set(game.width / 2, Math.max(game.height, game.width * 1.2), game.height / 2);
    camera.lookAt(new THREE.Vector3(game.width / 2, 0, game.height / 2));

    scene.environment = envMapTexture;
    scene.background = envMapTexture;
}

export function updateScene(game: Game, delta: number) {
    if (!paddleObject)
        paddleObject = generatePaddle(game);
    if (!ballObject)
        ballObject = generateBall(game);

    // The "simulation" has fixed ticks which may differ from rendering rate.
    // Do some compensation on fast moving objects.
    const overdraw = delta / game.TICK_LENGTH - Math.floor(delta / game.TICK_LENGTH);

    paddleObject.position.x = game.paddleX;
    paddleObject.position.y = 0;
    paddleObject.position.z = game.height - 20;


    ballObject.position.y = 0;
    ballObject.position.x = game.ball.x + game.ball.vX * overdraw * game.TICK_LENGTH;
    ballObject.position.z = game.ball.y + game.ball.vY * overdraw * game.TICK_LENGTH;

    for (const item of game.items) {
        if (item.type === 'powerup') {
            if (!gameItems[item.id])
                gameItems[item.id] = generatePowerup(item);
        } else
            if (!gameItems[item.id])
                gameItems[item.id] = generateBriq(item);

        const obj = gameItems[item.id];
        obj.position.x = item.x;
        obj.position.y = 0;
        obj.position.z = item.y;
    }
    for (const id in gameItems)
        if (!game.items.find(item => item.id === parseInt(id))) {
            scene.remove(gameItems[id]);
            delete gameItems[id];
        }

}

function generatePaddle(game: Game) {
    const geometry = new THREE.BoxGeometry(100, 20, 20);
    const paddle = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    paddle.castShadow = true;
    paddle.receiveShadow = true;
    scene.add(paddle);
    return paddle;
}

function generateBall(game: Game) {
    const geometry = new THREE.SphereGeometry(game.ball.radius);
    const ball = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
    return ball;
}

function generatePowerup(item: Powerup) {
    const geometry = new THREE.SphereGeometry(item.radius);
    const ball = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff00ff }));
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
    return ball;
}

function generateBriq(item: BriqoutBriq) {
    const geometry = new THREE.BoxGeometry(item.width, 20, item.height);
    const briq = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff1100 }));
    briq.castShadow = true;
    briq.receiveShadow = true;
    scene.add(briq);
    return briq;
}
