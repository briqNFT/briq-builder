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

//import EnvMapImg2 from '@/assets/industrial_sunset_02_puresky_1k.exr';
import StarknetLogo from '@/assets/briqout/starknet.png?url';
import EnvMapImg from '@/assets/briqout/starfield.jpg';
import NoiseImg from '@/assets/briqout/noise.png';

import type { Game, Powerup, BriqoutBriq, BriqoutBall, BriqoutItem } from 'briqout';
import { BallLaunch } from 'briqout';

import { backendManager } from '@/Backend';
import { APP_ENV } from '@/Meta';
import { main } from '@/builder/graphics/Builder';

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

let starkwareTexture: THREE.Texture;
let noiseTexture: THREE.Texture;

export async function useRenderer(_canvas: HTMLCanvasElement) {
    await threeSetupComplete;

    canvas = _canvas;

    if (renderer)
        renderer.dispose();

    // Recreate the renderer, because the canvas may need updating.
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Conceptually, we don't really need to reload what's below, but it leads to a blank scene.
    // I guess the GLB loader keeps a reference to the renderer somehow.
    //const envMapPromise = new Promise<THREE.Texture>(resolve => new EXRLoader().load(EnvMapImg2, function ( texture, _textureData ) {
    //    resolve(texture);
    //}));
    const envMapPromise = new Promise<THREE.Texture>(resolve => new THREE.TextureLoader().load(EnvMapImg, tex => {
        resolve(tex);
    }));

    const defaultLoader = new THREE.TextureLoader();
    new Promise<THREE.Texture>((resolve) =>
        defaultLoader.load(StarknetLogo, tex => {
            tex.encoding = THREE.sRGBEncoding;
            tex.flipY = false;
            resolve(tex);
        }),
    ).then(tex => starkwareTexture = tex);

    new Promise<THREE.Texture>((resolve) =>
        defaultLoader.load(NoiseImg, tex => {
            tex.encoding = THREE.sRGBEncoding;
            tex.flipY = false;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = 8;
            tex.generateMipmaps = false;
            resolve(tex);
        }),
    ).then(tex => noiseTexture = tex);

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
let hyperspace = undefined;
let graphicsTime = 0.0;

let gameItems = {} as Record<number, THREE.Object3D>;

const graphicsObjects = [] as THREE.Object3D[];

function resetScene(quality: SceneQuality) {
    paddleObject = undefined;
    gameItems = {};
    graphicsTime = 0.0;

    scene.clear();
    scene.add(camera);

    recreateComposer(quality);

    renderer.shadowMap.enabled = true;
    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.PCFShadowMap;
    else
        renderer.shadowMap.type = THREE.PCFShadowMap;
}

function setupHyperspace(scene: THREE.Scene, game: Game) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(game.width * 2, game.height * 2));
    floor.rotateX(-Math.PI / 2);
    floor.position.y = -50;
    floor.position.x = game.width / 2;
    floor.position.z = game.height / 2;
    hyperspace = floor;
    scene.add(floor);

    const material = new THREE.ShaderMaterial( {
        uniforms: {
            tex: { value: noiseTexture },
            time: { value: 0 },
            zoomFactor: { value: 0 },
            colA: { value: new THREE.Color(0x4400ff) },
            colB: { value: new THREE.Color(0x0044ff) },
        },
        vertexShader: `
        varying vec2 uv1;
        void main() {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            uv1 = uv;
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        `,
        fragmentShader:
        `
        varying vec2 uv1;
        uniform sampler2D tex;
        uniform float time;
        uniform float zoomFactor;

        uniform vec3 colA;
        uniform vec3 colB;

        #define PI 3.1415926538

        vec2 computeUV(vec2 xy, vec2 center, float rotateTime, float zoomTime) {
            vec2 dir = xy - center;
            float d = length(dir) + 0.01;
            float theta = 0.0;
            if (xy.x > center.x)
                theta = atan(dir.y, dir.x);
            else
                theta = atan(dir.y, -dir.x);
            
            float s = sign(dir.x);

            float u = theta / PI * s + rotateTime;
            float v = zoomFactor / d + zoomTime;  // or 1.0 - d, choose based on the effect you desire
        
            return vec2(u, v);
        }

        void main() {
            vec2 center = vec2(0.5);

            //gl_FragColor = vec4(computeUV(uv1, center, 0.0, 0.0).rr, 0.0, 1.0);
            //return;

            vec2 zoomA = computeUV(uv1, center, time * 0.2, time);
            vec2 zoomB = computeUV(uv1, center, 0.2 - time * 0.11, time + 0.4);
            float texA = texture2D(tex, zoomA).r;
            float texB = texture2D(tex, zoomB).r;

            // Mix between two blues depending on which texture dominates
            vec3 color = mix(colA, colB, texA);
            gl_FragColor = vec4(color * texA * texB, 1.0);
        }
        `,
    });
    floor.material = material;
}

function setupBounds(scene: THREE.Scene, game: Game) {
    // Draw 4 lines to mark the bounds of the game.
    // Use 4 rectangles that don't overlap in the corners, as lineMaterial is width 1 only.
    const width = 6;
    const material = new THREE.MeshBasicMaterial({ color: 0x66aaff });
    material.transparent = true;
    material.opacity = 0.1;
    material.blending = THREE.SubtractiveBlending;

    const lW = new THREE.PlaneGeometry(width, game.height);
    const lH = new THREE.PlaneGeometry(game.width + width * 2, width);
    const lleft = new THREE.Mesh(lW, material);
    const lright = new THREE.Mesh(lW, material);
    const ltop = new THREE.Mesh(lH, material);
    const lbottom = new THREE.Mesh(lH, material);
    lleft.position.x = -width / 2;
    lright.position.x = game.width + width / 2;
    lleft.position.y = game.height / 2;
    lright.position.y = game.height / 2;

    ltop.position.y = -width / 2;
    lbottom.position.y = game.height + width / 2;
    ltop.position.x = game.width / 2;
    lbottom.position.x = game.width / 2;

    const boundsObj = new THREE.Object3D();
    boundsObj.add(lleft);
    boundsObj.add(lright);
    boundsObj.add(ltop);
    boundsObj.add(lbottom);
    boundsObj.rotateX(-Math.PI / 2);
    boundsObj.position.set(0, 0, game.height);
    scene.add(boundsObj);
}

export function setupScene(game: Game, quality: SceneQuality) {
    resetScene(quality);

    // SSAO
    composer.passes[1].enabled = quality >= SceneQuality.ULTRA;
    // FXAA
    composer.passes[3].enabled = quality >= SceneQuality.MEDIUM && quality < SceneQuality.ULTRA;
    // SMAA
    composer.passes[4].enabled = quality >= SceneQuality.ULTRA;

    setupHyperspace(scene, game);

    setupBounds(scene, game);

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

export function updateScene(game: Game, delta: number, events: unknown[]) {
    if (!paddleObject)
        paddleObject = generatePaddle(game);

    // The "simulation" has fixed ticks which may differ from rendering rate.
    // Do some compensation on fast moving objects.
    const overdraw = delta / game.TICK_LENGTH - Math.floor(delta / game.TICK_LENGTH);

    paddleObject.position.x = game.paddleX;
    paddleObject.position.y = 0;
    paddleObject.position.z = game.height - 20;
    paddleObject.scale.x = game.paddleWidth / 100;

    graphicsTime += delta;

    hyperspace.material.uniforms['time'].value += delta * Math.min(2, game.time / 90 + 0.2);
    hyperspace.material.uniforms['zoomFactor'].value = Math.max(0.04, 0.08 - game.time / 500);

    // Update colors over time so things look good.
    hyperspace.material.uniforms['colA'].value.r = 0.3 + Math.cos(graphicsTime * 0.1) * 0.2;
    hyperspace.material.uniforms['colB'].value.g = 0.4 + Math.sin(graphicsTime * 0.13) * 0.14;

    for (const item of game.balls) {
        if (!gameItems[item.id])
            gameItems[item.id] = generateBall(item);
        const obj = gameItems[item.id];
        const isLaunching = +(item.isLaunching === BallLaunch.LOCKED);
        obj.position.x = item.x + item.vX * overdraw * game.TICK_LENGTH * (1-isLaunching);
        obj.position.y = 0;
        obj.position.z = item.y + item.vY * overdraw * game.TICK_LENGTH * (1-isLaunching);

        if (!isLaunching)
            obj.rotateY(delta * -Math.sign(item.vX) * Math.max(1, Math.abs(item.vX) / 50));

        obj.scale.setScalar(item.radius / 10);
        if (game.powerups.metalballs)
            obj.material.color.setHex(0xFF0000);
        else
            obj.material.color.setHex(0xFFFFFF);
    }

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

        if (item.type === 'powerup') {
            obj.children[obj.children.length - 1].rotateY(delta);
            updateTrailOfParticles(obj);
        }
    }

    for (const event of events)
        if (event.type === 'briqTonk') {
            graphicsTime += 1;
            const obj = generateBriqPopParticles();
            obj.position.x = event.x;
            obj.position.y = 0;
            obj.position.z = event.y;
            scene.add(obj);
            graphicsObjects.push(obj);
        }


    const drop = [];
    for (const obj of graphicsObjects) {
        updateBriqPopParticles(obj);
        if (obj.material.opacity <= 0)
            drop.push(obj);
    }
    for (const obj of drop) {
        scene.remove(obj);
        graphicsObjects.splice(graphicsObjects.indexOf(obj), 1);
    }

    for (const id in gameItems)
        if (!game.items.find(item => item.id === parseInt(id)))
            if (!game.balls.find(item => item.id === parseInt(id))) {
                scene.remove(gameItems[id]);
                delete gameItems[id];
            }
}

function generateTrailOfParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 10; i++)
        vertices.push(Math.random() * 40 - 20, 0, Math.random() * -70 - 10);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xFFCC11 });
    material.transparent = true;
    material.opacity = 1.0;
    material.size = 15;
    material.blending = THREE.AdditiveBlending;
    const points = new THREE.Points(geometry, material);
    return points;
}

function updateTrailOfParticles(obj: THREE.Object3D) {
    const points = obj.children[0] as THREE.Points;
    const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; ++i)
        if (Math.random() < -positions.getZ(i) / 6000) {
            positions.setZ(i, -10);
            positions.setX(i, Math.random() * 40 - 20);
        } else {
            positions.setZ(i, positions.getZ(i) - 0.4);
            positions.setX(i, positions.getX(i) + Math.random() * 0.1 - 0.05);
        }
    points.geometry.attributes.position.needsUpdate = true;
}

function generateBriqPopParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const speeds = [];
    for (let i = 0; i < 25; i++) {
        const v = Math.random() + 0.5;
        const r = Math.random() * Math.PI * 2;
        vertices.push(Math.cos(r) * Math.random() * 10, 0, Math.sin(r) * Math.random() * 10);
        speeds.push(v * Math.cos(r), v * Math.sin(r));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(vertices, 2));
    const material = new THREE.PointsMaterial({ color: 0xFF5500 });
    material.size = 10;
    material.transparent = true;
    const points = new THREE.Points(geometry, material);
    return points;
}

function updateBriqPopParticles(points: THREE.Points) {
    const positions = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speeds = points.geometry.getAttribute('velocity') as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; ++i) {
        positions.setX(i, positions.getX(i) + speeds.getX(i) * 0.2);
        positions.setZ(i, positions.getZ(i) + speeds.getY(i) * 0.2);
        speeds.setX(i, speeds.getX(i) * 0.98);
        speeds.setY(i, speeds.getY(i) * 0.98);
    }

    points.material.opacity -= 0.01;
    points.geometry.attributes.position.needsUpdate = true;
}


function generatePaddle(game: Game) {
    const geometry = new THREE.BoxGeometry(game.paddleWidth, 20, 20);
    const paddle = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    paddle.castShadow = true;
    paddle.receiveShadow = true;
    scene.add(paddle);
    return paddle;
}

function generateBall(ball: BriqoutBall) {
    const geometry = new THREE.CylinderGeometry(ball.radius, ball.radius, 10, 32)
    const ballMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({}));
    ballMesh.material.map = starkwareTexture;
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);
    return ballMesh;
}

const powerupCol = {
    'metalballs': 0xff0000,
    'multiball': 0x00ff00,
    'biggerpaddle': 0x0000ff,
} as Record<Powerup['kind'], number>;

function generatePowerup(item: Powerup) {
    const geometry = new THREE.TorusGeometry(item.radius, 2, 2, 32);
    geometry.rotateX(Math.PI / 2);
    const mainObj = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).convertSRGBToLinear() }));

    mainObj.add(generateTrailOfParticles());
    const ball = (() => {
        if (item.kind === 'metalballs') {
            const geometry = new THREE.SphereGeometry(item.radius / 2);
            const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(0x888888).convertSRGBToLinear() }));
            obj.material.metalness = 0.8;
            obj.material.roughness = 0.0;
            obj.material.envMap = envMapTexture;
            obj.castShadow = true;
            obj.receiveShadow = true;
            return obj;
        }
        if (item.kind === 'multiball') {
            const geometry = new THREE.CylinderGeometry(item.radius / 2, item.radius / 2, 10, 16)
            const ballMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({}));
            ballMesh.material.map = starkwareTexture;
            ballMesh.castShadow = true;
            ballMesh.receiveShadow = true;
            return ballMesh;
        }
        if (item.kind === 'biggerpaddle') {
            const geometry = new THREE.BoxGeometry(40, 10, 10);
            const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(0x00ff00).convertSRGBToLinear() }));
            obj.castShadow = true;
            obj.receiveShadow = true;
            return obj;
        }
    })();
    mainObj.add(ball);
    scene.add(mainObj);
    return mainObj;
}

function generateBriq(item: BriqoutBriq) {
    const geometry = new THREE.BoxGeometry(item.width, 20, item.height);
    const briq = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(item.color).convertSRGBToLinear() }));
    briq.castShadow = true;
    briq.receiveShadow = true;
    scene.add(briq);
    return briq;
}
