import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '../graphics/PreviewCube'
import { store } from '../../store/Store'

import { THREE } from '../../three';

export class EraserInput extends MouseInputState
{
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

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;
        
        // If the position is on the ground the intersection didn't return a cell.
        if (pos[1] < 0 || !this.isWithinBounds(...pos))
            getPreviewCube().visible = false;
        else
        {
            getPreviewCube().visible = true;
            getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        }
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("erase_multi", { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (!this.lastClickPos && mov > 10)
            return;
        
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        await store.dispatch("builderData/place_briqs", [{ pos: pos }]);
        // Update the preview cursor in a few milliseconds to let the world update.
        // Use the 'non event updating version' so the cube doesn't accidentally jump back.
        setTimeout(() => this.onPointerMove(event), 100);
    }
}

export class EraserMultiInput extends MouseInputState
{
    lastClickPos!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.lastClickPos = this.clampToBounds(...this.getIntersectionPos(this.curX, this.curY, true)!);
        if (!this.lastClickPos)
            throw new Error("Error: EraserMultiInput must have a well defined event position on entry");
        
        this.fsm.orbitControls.enabled = false;
        getPreviewCube().visible = true;
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    onExit() {
        getPreviewCube().visible = false;
        this.fsm.orbitControls.enabled = true;
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;
        pos = this.clampToBounds(...pos);

        if (this.lastClickPos[1] === -1 && pos[1] === -1)
            pos[1] = 0;

        getPreviewCube().scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1.1, Math.abs(this.lastClickPos[1] - pos[1]) + 1.1, Math.abs(this.lastClickPos[2] - pos[2]) + 1.1);
        getPreviewCube().position.set(
            ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
            ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
            ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
        );
    }

    async onPointerUp(event: PointerEvent)
    {
        try
        {
            let pos = this.getIntersectionPos(this.curX, this.curY, true);
            if (!pos)
                return;
            pos = this.clampToBounds(...pos);

            // Make it so that floor-squares have at least one-cell of erasing.
            if (this.lastClickPos[1] === -1 && pos[1] === -1)
                pos[1] = 0;
    
            let actionData = [];
            for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
                for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                    for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                        if (store.state.builderData.currentSet.getAt(x, y, z))
                            actionData.push({ pos: [x, y, z] });
            await store.dispatch("builderData/place_briqs", actionData);
        } finally {
            this.fsm.switchTo("erase");
        }
    }
}
