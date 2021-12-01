import { MouseInputState } from './BuilderInputState';
import { previewCube } from '../graphics/PreviewCube'
import { store } from '../../store/Store'

import * as THREE from 'three'

export class EraserInput extends MouseInputState
{
    lastClickPos: [number, number, number] | undefined;

    onEnter() {
        previewCube.scale.set(1.1, 1.1, 1.1);
        (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    onExit() {
        previewCube.scale.set(1, 1, 1);
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;
        
        // If the position is on the ground the intersection didn't return a cell.
        if (pos[1] < 0)
            previewCube.visible = false;
        else
        {
            previewCube.visible = true;
            previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        }
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("erase_multi", { x: event.clientX, y: event.clientY });
    }

    onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (!this.lastClickPos && mov > 10)
            return;
        
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        store.dispatch("builderData/place_briq", { pos: pos, color: "", voxelId: 0 });
    }
}

export class EraserMultiInput extends MouseInputState
{
    lastClickPos!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.lastClickPos = this.getIntersectionPos(this.curX, this.curY, true)!;
        if (!this.lastClickPos)
            throw new Error("Error: EraserMultiInput must have a well defined event position on entry");
        
        this.fsm.orbitControls.enabled = false;
        previewCube.visible = true;
        (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    onExit() {
        previewCube.visible = false;
        this.fsm.orbitControls.enabled = true;
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        previewCube.scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1.1, Math.abs(this.lastClickPos[1] - pos[1]) + 1.1, Math.abs(this.lastClickPos[2] - pos[2]) + 1.1);
        previewCube.position.set(
            ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
            ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
            ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
        );
    }

    onPointerUp(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                    if (store.state.builderData.currentSet.getAt(x, y, z))
                        store.dispatch("builderData/place_briq", { pos: [x, y, z], color: "", voxelId: 0 });
        this.fsm.switchTo("erase");
    }
}
