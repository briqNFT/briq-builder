import { MouseInputState } from './BuilderInputState';
import { VoxelAlignedSelection } from './SelectHelpers';
import getPreviewCube from '@/builder/graphics/PreviewCube';

import { THREE } from '@/three';
import { builderStore } from '@/builder/BuilderStore';
import { builderHistory } from '@/builder/BuilderHistory';
import { PlaceOrRemoveBriqs } from '@/builder/BuilderActions';

const { currentSet } = builderStore;

export class EraserInput extends MouseInputState {
    lastClickPos: [number, number, number] | undefined;

    onEnter() {
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1.1, 1.1, 1.1);
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    onExit() {
        getPreviewCube().scale.set(1, 1, 1);
        getPreviewCube().visible = false;
    }

    async onPointerMove(event: PointerEvent) {
        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        // If the position is on the ground the intersection didn't return a cell.
        if (pos[1] < 0)
            getPreviewCube().visible = false;
        else {
            getPreviewCube().visible = true;
            getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        }
    }

    async onPointerDown(event: PointerEvent) {
        if (event.shiftKey)
            this.fsm.switchTo('erase_multi', { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (!this.lastClickPos && mov > 10)
            return;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        builderHistory.push_command(PlaceOrRemoveBriqs, [{ pos: pos }]);
        builderHistory.push_checkpoint();
        // Update the preview cursor in a few milliseconds to let the world update.
        // Use the 'non event updating version' so the cube doesn't accidentally jump back.
        setTimeout(() => this.onPointerMove(event), 100);
    }
}

export class EraserMultiInput extends VoxelAlignedSelection {
    onEnter(data: any) {
        this.shouldClampToBounds = false;
        super.onEnter(data);
        this.switchBackTo = 'erase';
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    async doAction(pos: [number, number, number]) {
        const actionData = [];
        for (let x = Math.min(this.initialClickPos[0], pos[0]); x <= Math.max(this.initialClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.initialClickPos[1], pos[1]); y <= Math.max(this.initialClickPos[1], pos[1]); ++y)
                for (
                    let z = Math.min(this.initialClickPos[2], pos[2]);
                    z <= Math.max(this.initialClickPos[2], pos[2]);
                    ++z
                )
                    if (currentSet.value.getAt(x, y, z))
                        actionData.push({ pos: [x, y, z] as [number, number, number] });
        builderHistory.push_command(PlaceOrRemoveBriqs, actionData);
        builderHistory.push_checkpoint();
    }
}
