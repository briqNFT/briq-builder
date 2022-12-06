import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '@/builder/graphics/PreviewCube';
import { inputStore } from '../InputStore';

import type { SetData } from '@/builder/SetData';

import { THREE } from '@/three';
import { VoxelAlignedSelection } from './SelectHelpers';

import { watchEffect } from 'vue';
import { builderStore } from '@/builder/BuilderStore';

const { currentSet } = builderStore;

import SprayCan from '@/assets/spray-can-solid.svg?url';
import { PaintBriqs } from '@/builder/BuilderActions';
import { builderHistory } from '@/builder/BuilderHistory';
//import SprayCan from '@/assets/brush-solid.svg?url';
//import SprayCan from '@/assets/paintbrush-fine-regular.svg?url';

export class PainterInput extends MouseInputState {
    onEnter() {
        getPreviewCube().scale.set(1.1, 1.1, 1.1);
        getPreviewCube().visible = false;
        // update preview cuve pos
        this.onPointerMove();
    }

    onExit() {
        document.body.style.cursor = 'auto';
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1, 1, 1);
    }

    onPointerMove(event: PointerEvent) {
        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0) {
            getPreviewCube().visible = false;
            document.body.style.cursor = 'auto';
            return;
        }
        document.body.style.cursor = `url(${SprayCan}), cell`;
        if (!getPreviewCube().visible)
            getPreviewCube().visible = true;

        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
    }

    onPointerDown(event: PointerEvent) {
        if (event.button === 2)
            return;
        if (event.shiftKey)
            this.fsm.switchTo('paint_multi', { x: event.clientX, y: event.clientY });
        // If we are targeting a briq
        else if (getPreviewCube().visible)
            this.fsm.switchTo('paint_spray', { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || !this.isWithinBounds(...pos))
            return;

        // Left-click paints, right-click samples the briq color.
        if (event.button === 2) {
            const target = (currentSet.value as SetData).getAt(...pos);
            if (target) {
                inputStore.currentMaterial = target.material;
                inputStore.currentColor = target.color;
            }
        } else {
            builderHistory.push_command(PaintBriqs, [{
                pos: pos,
                color: inputStore.currentColor,
                material: inputStore.currentMaterial,
            }]);
            builderHistory.push_checkpoint();
        }
        // Update preview cube.
        await this.onPointerMove(event);
    }
}

export class PainterSprayInput extends MouseInputState {
    onEnter() {
        this.fsm.orbitControls.enabled = false;
        this.fsm.store.grabFocus = true;

        this.onPointerMove();
        getPreviewCube().scale.set(1.1, 1.1, 1.1);
        getPreviewCube().visible = true;
        document.body.style.cursor = `url(${SprayCan}), cell`;
    }

    onExit() {
        this.fsm.orbitControls.enabled = true;
        this.fsm.store.grabFocus = false;
        document.body.style.cursor = 'auto';
        getPreviewCube().scale.set(1, 1, 1);
        getPreviewCube().visible = false;
        builderHistory.push_checkpoint();
    }

    async onPointerMove(event: PointerEvent) {
        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);

        const target = (currentSet.value as SetData).getAt(...pos);
        if (target?.color === inputStore.currentColor && target?.material === inputStore.currentMaterial)
            return;
        builderHistory.push_command(PaintBriqs, [{
            pos: pos,
            color: inputStore.currentColor,
            material: inputStore.currentMaterial,
        }]);
    }

    async onPointerUp(_: unknown) {
        this.fsm.switchTo('paint');
    }
}

export class PainterMultiInput extends VoxelAlignedSelection {
    onEnter(data: any) {
        this.showRuler = true;
        super.onEnter(data);
        this.switchBackTo = 'paint';

        watchEffect(() => {
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        });
    }

    async doAction(pos: [number, number, number]) {
        const actionData = [];
        for (let x = Math.min(this.initialClickPos[0], pos[0]); x <= Math.max(this.initialClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.initialClickPos[1], pos[1]); y <= Math.max(this.initialClickPos[1], pos[1]); ++y)
                for (let z = Math.min(this.initialClickPos[2], pos[2]); z <= Math.max(this.initialClickPos[2], pos[2]); ++z)
                    if (currentSet.value.getAt(x, y, z))
                        actionData.push({
                            pos: [x, y, z] as [number, number, number],
                            color: inputStore.currentColor,
                            material: inputStore.currentMaterial,
                        });
        builderHistory.push_command(PaintBriqs, actionData);
        builderHistory.push_checkpoint();
    }
}
