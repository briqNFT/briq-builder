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

        hyperspace = setupHyperspace();
        composer.addPass(hyperspace);

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
        composer.passes[4].uniforms['resolution'].value.x = 1 / width;
        composer.passes[4].uniforms['resolution'].value.y = 1 / height;
        // SMAA
        composer.passes[5].setSize(width, height);

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        // Update the FOV so that the whole game screen is in view.
        camera.fov = Math.max(30, 30 * 1.66667 / camera.aspect);

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
let hyperspace = undefined as unknown as ReturnType<typeof setupHyperspace>;
let colorTime = 0.0;
let postGameTime = 0.0;

let gameItems = {} as Record<number, THREE.Object3D>;

const graphicsObjects = [] as THREE.Object3D[];

function resetScene(quality: SceneQuality) {
    paddleObject = undefined;
    gameItems = {};
    colorTime = 0.0;
    postGameTime = 0.0;

    scene.clear();
    scene.add(camera);

    recreateComposer(quality);

    renderer.shadowMap.enabled = true;
    if (quality <= SceneQuality.LOW)
        renderer.shadowMap.type = THREE.PCFShadowMap;
    else
        renderer.shadowMap.type = THREE.PCFShadowMap;
}

function setupHyperspace() {
    return new ShaderPass({
        name: 'Hyperspace',
        uniforms: {
            tDiffuse: { value: null },
            tex: { value: noiseTexture },
            time: { value: 0 },
            zoomFactor: { value: 0 },
            colA: { value: new THREE.Color(0x4401ff) },
            colB: { value: new THREE.Color(0x0144ff) },
            brightBonus: { value: 0 },
            aspectRatio: { value: 1 },
        },
        vertexShader: `
        varying vec2 uv1;
        varying vec2 uv2;
        uniform float aspectRatio;
        void main() {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            uv1 = uv;
            // Fix uv2 for aspect ratio so that it's always square-ish
            uv2 = vec2(position.x, position.y / aspectRatio);
            gl_Position = projectionMatrix * modelViewPosition;
        }
        `,
        fragmentShader:
        `
        varying vec2 uv1;
        varying vec2 uv2;
        uniform sampler2D tex;
        uniform float time;
        uniform float zoomFactor;
        uniform float aspectRatio;

        uniform vec3 colA;
        uniform vec3 colB;
        uniform float brightBonus;
		uniform sampler2D tDiffuse;

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
            if (abs(uv2.y) > 0.7 || abs(uv2.x) > 1.0 / aspectRatio * 2.0) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
            }
            vec4 texel = texture2D( tDiffuse, uv1 );
            vec2 center = vec2(0.0);
            if (texel.a > 0.99) {
                gl_FragColor = texel;
                return;
            }
            //gl_FragColor = vec4(computeUV(uv1, center, 0.0, 0.0).rr, 0.0, 1.0);
            //return;

            vec2 zoomA = computeUV(uv2, center, time * 0.2, time);
            vec2 zoomB = computeUV(uv2, center, 0.2 - time * 0.11, time + 0.4);
            float texA = texture2D(tex, zoomA).r + brightBonus;
            float texB = texture2D(tex, zoomB).r + brightBonus;

            // Mix between two blues depending on which texture dominates
            vec3 color = mix(colA, colB, texA);
            gl_FragColor = vec4(mix(color * texA * texB, texel.rgb, texel.a), 1.0);
        }
        `,
    });
}

function setupBounds(scene: THREE.Scene, game: Game) {
    // Draw 4 lines to mark the bounds of the game.
    // Use 4 rectangles that don't overlap in the corners, as lineMaterial is width 1 only.
    const width = 6;
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    material.transparent = true;
    material.opacity = 0.33;

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
    //scene.background = envMapTexture;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(1, Math.max(0, t));
}

function easeIn(t: number) {
    return t * t;
}

export function updateScene(game: Game, delta: number, events: unknown[]) {
    if (!paddleObject)
        paddleObject = generatePaddle(game);

    // The "simulation" has fixed ticks which may differ from rendering rate.
    // Do some compensation on fast moving objects.
    const overdraw = delta / game.TICK_LENGTH - Math.floor(delta / game.TICK_LENGTH);

    hyperspace.uniforms.aspectRatio.value = camera.aspect;

    if (game.status === 'lost') {
        postGameTime += delta;
        hyperspace.uniforms['colA'].value.r = lerp(0.3 + Math.cos(colorTime * 0.1) * 0.2, 1.0, postGameTime);
        hyperspace.uniforms['colB'].value.r = 0.0;
        hyperspace.uniforms['colA'].value.g = 0.0;
        hyperspace.uniforms['colB'].value.g = lerp(0.4 + Math.sin(colorTime * 0.13) * 0.14, 0.0, postGameTime);
        hyperspace.uniforms['colA'].value.b = lerp(1.0, 0.0, postGameTime);
        hyperspace.uniforms['colB'].value.b = lerp(1.0, 0.0, postGameTime);

        hyperspace.uniforms['time'].value += lerp(delta * Math.min(2, game.time / 90 + 0.2), 0, postGameTime / 3.0);

        camera.translateZ(easeIn(lerp(0.0, 1.0, postGameTime / 10.0)) * 300);
        return;
    } else if (game.status === 'won') {
        postGameTime += delta;
        hyperspace.uniforms['time'].value += delta * Math.min(3, Math.min(2, game.time / 90 + 0.2) * (1 + postGameTime * 2));
        hyperspace.uniforms['zoomFactor'].value = Math.max(0.02, Math.max(0.04, 0.08 - game.time / 500) - postGameTime / 100.0);
        hyperspace.uniforms['brightBonus'].value = postGameTime / 10.0;

        hyperspace.uniforms['colA'].value.r = lerp(0.3 + Math.cos(colorTime * 0.1) * 0.2, 1.0, (postGameTime - 6.0) / 5.0);
        hyperspace.uniforms['colB'].value.r = lerp(0.0, 1.0, (postGameTime - 6.0) / 5.0);
        hyperspace.uniforms['colA'].value.g = lerp(0.0, 1.0, (postGameTime - 6.0) / 5.0);
        hyperspace.uniforms['colB'].value.g = lerp(0.4 + Math.sin(colorTime * 0.13) * 0.14, 1.0, (postGameTime - 6.0) / 5.0);

        camera.translateZ(easeIn(lerp(0.0, 1.0, postGameTime / 10.0)) * 300);
        return;
    }

    paddleObject.position.x = game.paddleX;
    paddleObject.position.y = 0;
    paddleObject.position.z = game.height - 20;
    paddleObject.scale.x = game.paddleWidth / 100;

    colorTime += delta;

    hyperspace.uniforms['time'].value += delta * Math.min(2, game.time / 90 + 0.2);
    hyperspace.uniforms['zoomFactor'].value = Math.max(0.04, 0.08 - game.time / 500);

    // Update colors over time so things look good.
    hyperspace.uniforms['colA'].value.r = 0.3 + Math.cos(colorTime * 0.1) * 0.2;
    hyperspace.uniforms['colB'].value.g = 0.4 + Math.sin(colorTime * 0.13) * 0.14;

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
            colorTime += 1;
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
    const paddle = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(0xdd4400).convertSRGBToLinear() }));
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
            const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(0xdd4400).convertSRGBToLinear() }));
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
