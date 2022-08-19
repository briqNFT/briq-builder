import { MouseInputState } from './BuilderInputState';
import { selectionRender } from '../Selection';
import { THREE, SelectionBox as ThreeSelectionBox } from '@/three';
import getPreviewCube from '@/builder/graphics/PreviewCube';

import { store } from '@/store/Store';
import { camera, overlayObjects } from '@/builder/graphics/Builder';
import type { HotkeyHandle } from '@/Hotkeys';
import type { Briq } from '@/builder/Briq';

const { currentSet } = builderStore;

export class BoxSelection extends MouseInputState {
    startX!: number;
    startY!: number;

    switchBackTo!: string;
    cancelHotkey!: HotkeyHandle;

    onEnter(data: any) {
        this.switchBackTo = data.switchBackTo;

        this.curX = data.x;
        this.curY = data.y;
        this.startX = data.x;
        this.startY = data.y;

        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;
        this.fsm.gui.startX = this.startX;
        this.fsm.gui.startY = this.startY;

        this.fsm.gui.selectionBox = true;

        this.fsm.orbitControls.enabled = false;

        this.fsm.store.grabFocus = true;

        selectionRender.show();
        this.cancelHotkey = this.fsm.hotkeyMgr.subscribe('escape', () => {
            this.fsm.switchTo(this.switchBackTo);
        });
    }

    onExit() {
        this.fsm.hotkeyMgr.unsubscribe(this.cancelHotkey);
        selectionRender.hide();
        this.fsm.store.grabFocus = false;
        this.fsm.orbitControls.enabled = true;
        this.fsm.gui.selectionBox = false;
    }

    async onPointerMove(event: PointerEvent) {
        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;
    }

    async onPointerUp(event: PointerEvent) {
        if (this.startX === this.curX && this.startY === this.curY) {
            const pos = this.getIntersectionPos(this.curX, this.curY, true);
            this.fsm.store.selectionMgr.add(...pos);
            this.fsm.switchTo(this.switchBackTo);
            return;
        }
        try {
            const startX = (this.startX / window.innerWidth - 0.5) * 2;
            let curX = (this.curX / window.innerWidth - 0.5) * 2;
            const startY = -(this.startY / window.innerHeight - 0.5) * 2;
            let curY = -(this.curY / window.innerHeight - 0.5) * 2;
            if (startX === curX)
                curX += 0.0001;
            if (startY === curY)
                curY += 0.0001;
            // Hack around the threeselectionbox code to reuse the frustum construction code.
            const fakeScene = {
                children: [],
            };
            const box = new ThreeSelectionBox(camera, fakeScene, 10000);
            let frustum: THREE.Frustum;
            box.searchChildInFrustum = (ft) => (frustum = ft);
            box.select(new THREE.Vector3(startX, startY, 0), new THREE.Vector3(curX, curY, 0));
            const ret = [] as Briq[];
            const cpos1 = new THREE.Vector3();
            const cpos2 = new THREE.Vector3();
            const cbox = new THREE.Box3(cpos1, cpos2);
            currentSet.value.forEach((briq, pos) => {
                cpos1.x = pos[0];
                cpos1.y = pos[1];
                cpos1.z = pos[2];
                cpos2.x = pos[0] + 1;
                cpos2.y = pos[1] + 1;
                cpos2.z = pos[2] + 1;
                if (frustum.intersectsBox(cbox))
                    ret.push(briq);
            });
            await this.doAction(ret);
        } finally {
            this.fsm.switchTo(this.switchBackTo);
        }
    }

    // Override me
    async doAction(briqs: Briq[]) {}
}
import Ruler from '@/assets/ruler.png';
import { builderStore } from '@/builder/BuilderStore';

function createRulerObject() {
    const texture = new THREE.TextureLoader().load(Ruler);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.magFilter = THREE.NearestFilter;

    texture.anisotropy = 4;

    const material = new THREE.ShaderMaterial( {
        uniforms: {
            x_y_z: { value: new THREE.Vector3(0, 0, 0) },
            tex: { value: texture },
        },
        vertexShader: `
        uniform vec3 x_y_z;
        attribute vec3 color;
        varying vec3 col;
        varying vec2 tc;
        void main() {
            vec3 boost = color * x_y_z;
            tc = uv * vec2(max(boost.x, max(boost.y, boost.z)), 1.0);
            col = color;
            vec4 modelViewPosition = modelViewMatrix * vec4(position + boost, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        `,
        fragmentShader:
        `
        varying vec2 tc;
        varying vec3 col;
        uniform sampler2D tex;
        void main() {
            gl_FragColor = mix(vec4(1.0), vec4(0.0, 0.0, 0.0, 1.0), texture2D(tex, tc).a);
        }
        `,
    });
    material.side = THREE.DoubleSide;
    const ret = new THREE.Mesh();//new THREE.BoxBufferGeometry(1, 1, 1));
    const vertices = [];
    const colors = [];
    const uvs = [];
    const geom = new THREE.BufferGeometry();

    const WIDTH = 0.4;

    vertices.push(...[0, 0, 0]);
    uvs.push(...[0, 0]);
    colors.push(...[0, 0, 0]);
    vertices.push(...[0, 0, WIDTH]);
    uvs.push(...[0, 1]);
    colors.push(...[0, 0, 0]);
    vertices.push(...[WIDTH, 0, 0]);
    uvs.push(...[0, 1]);
    colors.push(...[0, 0, 0]);
    vertices.push(...[WIDTH, 0, WIDTH]);
    uvs.push(...[0, 1]);
    colors.push(...[0, 0, 0]);

    vertices.push(...[0, 0, 0]);
    uvs.push(...[1, 0]);
    colors.push(...[1, 0, 0]);
    vertices.push(...[0, 0, WIDTH]);
    uvs.push(...[1, 1]);
    colors.push(...[1, 0, 0]);

    vertices.push(...[0, 0, 0]);
    uvs.push(...[1, 0]);
    colors.push(...[0, 0, 1]);
    vertices.push(...[WIDTH, 0, 0]);
    uvs.push(...[1, 1]);
    colors.push(...[0, 0, 1]);

    vertices.push(...[0, 0, 0]);
    uvs.push(...[1, 0]);
    colors.push(...[0, 1, 0]);
    vertices.push(...[WIDTH, 0, 0]);
    uvs.push(...[1, 1]);
    colors.push(...[0, 1, 0]);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex([
        0, 5, 4,  5, 1, 0,
        0, 6, 2,  2, 6, 7,
        0, 2, 8,  9, 8, 2,
        // TODO: Finish with the main square, which will be black, for cleanliness.
        // (needs to only be done if the scale is > 1 in at least 2 directions)
        // 0, 3, 2,  3, 0, 1,
    ]);

    ret.geometry = geom;
    //ret.geometry.setAttribute('color', new THREE.Float32BufferAttribute([0, 1, 2, 0, 1, 2, 0, 1, 2,], 3) );
    ret.material = material;
    return ret;
}

export class VoxelAlignedSelection extends MouseInputState {
    initialClickPos!: [number, number, number];
    currentClickPos!: [number, number, number] | undefined;
    switchBackTo!: string;
    cancelHotkey!: HotkeyHandle;

    extruding = false; // Whether to get the intersection pos or extrude by a briq.
    shouldClampToBounds = true;

    showRuler = false;
    ruler!: THREE.Mesh;

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;

        this.initialClickPos = this.getIntersectionPos(this.curX, this.curY, !this.extruding)!;
        if (this.initialClickPos) {
            if (this.initialClickPos[1] < 0)
                this.initialClickPos[1] = 0;

            if (this.shouldClampToBounds)
                this.initialClickPos = this.clampToBounds(...this.initialClickPos);
        }

        this.currentClickPos = this.initialClickPos;
        this.updatePreviewCube();

        if (this.showRuler) {
            this.ruler = createRulerObject();
            overlayObjects.add(this.ruler);
        }

        this.fsm.orbitControls.enabled = false;
        this.fsm.store.grabFocus = true;
        this.cancelHotkey = this.fsm.hotkeyMgr.subscribe('escape', () => {
            this.fsm.switchTo(this.switchBackTo);
        });
    }

    onExit() {
        this.fsm.hotkeyMgr.unsubscribe(this.cancelHotkey);
        overlayObjects.remove(this.ruler);
        getPreviewCube().visible = false;
        this.fsm.store.grabFocus = false;
        this.fsm.orbitControls.enabled = true;
    }

    updatePreviewCube() {
        if (!this.currentClickPos) {
            getPreviewCube().visible = false;
            return;
        }
        getPreviewCube().visible = true;
        getPreviewCube().scale.set(
            Math.abs(this.initialClickPos[0] - this.currentClickPos[0]) + 1.1,
            Math.abs(this.initialClickPos[1] - this.currentClickPos[1]) + 1.1,
            Math.abs(this.initialClickPos[2] - this.currentClickPos[2]) + 1.1,
        );
        getPreviewCube().position.set(
            (this.initialClickPos[0] + this.currentClickPos[0]) / 2 + 0.5,
            (this.initialClickPos[1] + this.currentClickPos[1]) / 2 + 0.5,
            (this.initialClickPos[2] + this.currentClickPos[2]) / 2 + 0.5,
        );
    }

    updateRuler() {
        this.fsm.gui.range = undefined;

        if (!this.showRuler)
            return;
        if (!this.currentClickPos) {
            this.ruler.visible = false;
            return;
        }
        this.ruler.visible = true;
        (this.ruler.material as THREE.ShaderMaterial).uniforms.x_y_z = { value: new THREE.Vector3(
            this.initialClickPos[0] === this.currentClickPos[0] ? 0 : Math.abs(this.initialClickPos[0] - this.currentClickPos[0]) + 1,
            this.initialClickPos[1] === this.currentClickPos[1] ? 0 : Math.abs(this.initialClickPos[1] - this.currentClickPos[1]) + 1,
            this.initialClickPos[2] === this.currentClickPos[2] ? 0 : Math.abs(this.initialClickPos[2] - this.currentClickPos[2]) + 1,
        ) };
        this.ruler.position.set(
            Math.min(this.initialClickPos[0], this.currentClickPos[0]),
            Math.min(this.initialClickPos[1], this.currentClickPos[1]),
            Math.min(this.initialClickPos[2], this.currentClickPos[2]),
        );

        this.fsm.gui.range = {
            x: this.currentClickPos[0] - this.initialClickPos[0],
            y: this.currentClickPos[1] - this.initialClickPos[1],
            z: this.currentClickPos[2] - this.initialClickPos[2],
        };
        this.fsm.gui.infoX = {
            x: Math.max(this.currentClickPos[0], this.initialClickPos[0]) + 1,
            y: Math.min(this.currentClickPos[1], this.initialClickPos[1]),
            z: Math.min(this.currentClickPos[2], this.initialClickPos[2]) + 0.2,
        };
        this.fsm.gui.infoY = {
            x: Math.min(this.currentClickPos[0], this.initialClickPos[0]) + 0.2,
            y: Math.max(this.currentClickPos[1], this.initialClickPos[1]) + 1,
            z: Math.min(this.currentClickPos[2], this.initialClickPos[2]) + 0.2,
        };
        this.fsm.gui.infoZ = {
            x: Math.min(this.currentClickPos[0], this.initialClickPos[0]) + 0.2,
            y: Math.min(this.currentClickPos[1], this.initialClickPos[1]),
            z: Math.max(this.currentClickPos[2], this.initialClickPos[2]) + 1,
        };
    }

    async onPointerMove(event: PointerEvent) {
        this.currentClickPos = this.getIntersectionPos(this.curX, this.curY, !this.extruding);
        if (!this.currentClickPos)
            return;

        if (this.shouldClampToBounds)
            this.currentClickPos = this.clampToBounds(...this.currentClickPos);

        if (!this.initialClickPos) {
            this.initialClickPos = this.currentClickPos;
            if (this.initialClickPos[1] < 0)
                this.initialClickPos[1] = 0;
        }

        // Make it so that selecting floor-squares does something.
        if (!this.shouldClampToBounds && this.initialClickPos[1] === 0 && this.currentClickPos[1] === -1)
            this.currentClickPos[1] = 0;

        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;

        this.updateRuler();
        this.updatePreviewCube();
    }

    async onPointerUp(event: PointerEvent) {
        try {
            this.currentClickPos = this.getIntersectionPos(this.curX, this.curY, !this.extruding);
            if (!this.currentClickPos)
                return;
            if (this.shouldClampToBounds)
                this.currentClickPos = this.clampToBounds(...this.currentClickPos);

            // Make it so that selecting floor-squares does something.
            if (!this.shouldClampToBounds && this.initialClickPos[1] === 0 && this.currentClickPos[1] === -1)
                this.currentClickPos[1] = 0;
            await this.doAction(this.currentClickPos);
        } finally {
            this.fsm.switchTo(this.switchBackTo);
        }
    }

    // Override me
    async doAction(pos: [number, number, number]) {}
}
