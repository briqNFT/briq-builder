import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '@/builder/graphics/PreviewCube';
import { inputStore } from '../InputStore';
import { store } from '@/store/Store';

import { THREE } from '@/three';
import { VoxelAlignedSelection } from './SelectHelpers';

import { watchEffect } from 'vue';
import { builderStore } from '@/builder/BuilderStore';
import { underlayObjects } from '@/builder/graphics/Builder';

const { currentSet } = builderStore;

export class PlacerInput extends MouseInputState {
    onEnter() {
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1, 1, 1);

        this.grid = createGrid();
        underlayObjects.add(this.grid);
    }

    onExit() {
        underlayObjects.remove(this.grid);
        getPreviewCube().visible = false;
    }

    async onPointerMove(event: PointerEvent) {
        const pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;
        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        this.grid.position.set(Math.floor(pos[0]), Math.floor(pos[1]) + 0.01, Math.floor(pos[2]));
        if (this.isWithinBounds(...pos)) {
            getPreviewCube().visible = true;
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        } else
            getPreviewCube().visible = false;
    }

    async onPointerDown(event: PointerEvent) {
        if (event.shiftKey)
            this.fsm.switchTo('place_multi', { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        const removing = event.button !== 0;
        const pos = this.getIntersectionPos(this.curX, this.curY, removing);
        if (!pos || !this.isWithinBounds(...pos))
            return;
        try {
            const data = removing
                ? { pos }
                : { pos, color: inputStore.currentColor, material: inputStore.currentMaterial };
            await store.dispatch('builderData/place_briqs', [data]);
            // Update the preview cursor in a few milliseconds to let the world update.
            // Use the 'non event updating version' so the cube doesn't accidentally jump back.
            setTimeout(() => this.onPointerMove(event), 100);
        } catch (_) {}
    }
}

export class PlacerMultiInput extends VoxelAlignedSelection {
    onEnter(data: any) {
        this.extruding = true;
        this.showRuler = true;
        super.onEnter(data);
        this.switchBackTo = 'place';

        watchEffect(() => {
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        });
    }
    async doAction(pos: [number, number, number]) {
        const briqs = [];
        for (let x = Math.min(this.initialClickPos[0], pos[0]); x <= Math.max(this.initialClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.initialClickPos[1], pos[1]); y <= Math.max(this.initialClickPos[1], pos[1]); ++y)
                for (
                    let z = Math.min(this.initialClickPos[2], pos[2]);
                    z <= Math.max(this.initialClickPos[2], pos[2]);
                    ++z
                )
                    if (!currentSet.value.getAt(x, y, z))
                        briqs.push({
                            pos: [x, y, z],
                            color: inputStore.currentColor,
                            material: inputStore.currentMaterial,
                        });
        await store.dispatch('builderData/place_briqs', briqs);
    }
}

export class NFTPlacerInput extends PlacerInput {
    token_data!: { material: string; token_id: string };

    onEnter(data: { material: string; token_id: string }) {
        super.onEnter();
        this.token_data = data;
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x002496);
    }

    async onPointerMove(event: PointerEvent) {
        super.onPointerMove(event);
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x002496);
    }

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        const removing = event.button !== 0;
        const pos = this.getIntersectionPos(this.curX, this.curY, removing);
        if (!pos || !this.isWithinBounds(...pos))
            return;
        try {
            const data = removing
                ? { pos }
                : {
                    pos,
                    color: inputStore.currentColor,
                    material: this.token_data.material,
                    id: this.token_data.token_id,
                };
            await store.dispatch('builderData/place_briqs', [data]);
            // Update the preview cursor in a few milliseconds to let the world update.
            // Use the 'non event updating version' so the cube doesn't accidentally jump back.
            setTimeout(() => this.onPointerMove(event), 100);
            this.fsm.switchTo('place');
        } catch (_) {}
    }
}

function createGrid() {
    /*
    const gridXZ = new THREE.GridHelper(
        10,
        10,
        new THREE.Color('#ff0000').convertSRGBToLinear(),
        new THREE.Color('#ff0000').convertSRGBToLinear(),
    );
    gridXZ.position.set(0, 0, 0);
    return gridXZ;
    */
    const material = new THREE.ShaderMaterial( {
        uniforms: {
        },
        vertexShader: `
        varying vec3 pos;
        varying vec2 tc;
        void main() {
            tc = uv;
            pos = position.xyz;
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
        `,
        fragmentShader:
        `
        varying vec3 pos;
        varying vec2 tc;
        void main() {
            float shouldGrid = float(mod(pos.x, 1.0f) < 0.05 || mod(pos.z, 1.0f) < 0.05);
            float fadeAlpha = clamp(1.5 - length((tc.xy - vec2(0.5, 0.5)) * 2.0) * 2.0, 0.0, 1.0);
            gl_FragColor = vec4(1.0, 0.0, 0.0, shouldGrid * fadeAlpha);
        }
        `,
    });
    material.side = THREE.DoubleSide;
    const ret = new THREE.Mesh();
    const vertices = [];
    const uvs = [];
    const geom = new THREE.BufferGeometry();

    const WIDTH = 9.0;

    vertices.push(...[-WIDTH, 0, -WIDTH]);
    uvs.push(...[0, 0]);
    vertices.push(...[-WIDTH, 0, WIDTH]);
    uvs.push(...[0, 1]);
    vertices.push(...[WIDTH, 0, -WIDTH]);
    uvs.push(...[1, 0]);
    vertices.push(...[WIDTH, 0, WIDTH]);
    uvs.push(...[1, 1]);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex([
        0, 2, 1,  3, 2, 1,
    ]);
    ret.geometry = geom;
    ret.material = material;
    ret.material.transparent = true;
    return ret;
}
