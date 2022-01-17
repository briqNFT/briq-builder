import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '../graphics/PreviewCube'
import { inputStore } from "./InputStore";
import { store } from '../../store/Store';

import type { SetData } from '../SetData';

import { THREE } from '../../three';
export class PainterInput extends MouseInputState
{
    onEnter() {
        getPreviewCube().scale.set(1.1, 1.1, 1.1);
        getPreviewCube().visible = false;
    }

    onExit() {
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1, 1, 1);
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
        {
            getPreviewCube().visible = false;
            return;
        }
        if (!getPreviewCube().visible)
            getPreviewCube().visible = true;

        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("paint_multi", { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        // Left-click paints, right-click samples the briq color.
        if (event.button === 2)
        {
            let col = (store.state.builderData.currentSet as SetData).getAt(...pos)?.color;
            if (col)
                inputStore.currentColor = col;
        }
        else
            await store.dispatch("builderData/set_briq_color", [{ pos: pos, color: inputStore.currentColor }]);
        // Update preview cube.
        await this.onPointerMove(event);
    }
}

export class PainterMultiInput extends MouseInputState
{
    lastClickPos!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.lastClickPos = this.getIntersectionPos(this.curX, this.curY, true)!;
        if (!this.lastClickPos)
            throw new Error("Error: PainterMultiInput must have a well defined event position on entry");
        
        this.fsm.orbitControls.enabled = false;
        getPreviewCube().visible = true;
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

        getPreviewCube().scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1.1, Math.abs(this.lastClickPos[1] - pos[1]) + 1.1, Math.abs(this.lastClickPos[2] - pos[2]) + 1.1);
        getPreviewCube().position.set(
            ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
            ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
            ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
        );
    }

    async onPointerUp(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        let actionData = [];
        for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                {
                    if (store.state.builderData.currentSet.getAt(x, y, z))
                        actionData.push({ pos: [x, y, z], color: inputStore.currentColor });
                }
        await store.dispatch("builderData/set_briq_color", actionData);
        this.fsm.switchTo("paint");
    }
}
