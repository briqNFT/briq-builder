import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '../graphics/PreviewCube'
import { inputStore } from "./InputStore";
import { store } from '../../store/Store'

import { cellSize } from '../../builder/Constants';

import { THREE } from '../../three';

const MATERIAL = "0x1";

export class PlacerInput extends MouseInputState
{
    onEnter()
    {
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1, 1, 1);
    }
    
    onExit()
    {
        getPreviewCube().visible = false;
    }

    onPointerMove(event: PointerEvent)
    {
        const pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;
        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        if (Math.abs(pos[0]) <= cellSize && Math.abs(pos[2]) <= cellSize && pos[1] >= 0)
        {
            getPreviewCube().visible = true;
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        }
        else
            getPreviewCube().visible = false;
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("place_multi", { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        
        const removing = event.button !== 0;
        const pos = this.getIntersectionPos(this.curX, this.curY, removing);
        if (!pos)
            return;
        try {
            let data = removing ? { pos } : { pos, color: inputStore.currentColor, material: MATERIAL };
            await store.dispatch("builderData/place_briqs", [data]);
            // Update the preview cursor in a few milliseconds to let the world update.
            // Use the 'non event updating version' so the cube doesn't accidentally jump back.
            setTimeout(() => this.onPointerMove(event), 100);
        } catch(_) {}
    }
}

export class PlacerMultiInput extends MouseInputState
{
    lastClickPos!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.lastClickPos = this.getIntersectionPos(this.curX, this.curY)!;
        if (!this.lastClickPos)
            throw new Error("Error: PlacerMultiInput must have a well defined event position on entry");
        
        this.fsm.orbitControls.enabled = false;
        getPreviewCube().visible = true;
    }

    onExit() {
        getPreviewCube().visible = false;
        this.fsm.orbitControls.enabled = true;
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;

        getPreviewCube().scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1, Math.abs(this.lastClickPos[1] - pos[1]) + 1, Math.abs(this.lastClickPos[2] - pos[2]) + 1);
        getPreviewCube().position.set(
            ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
            ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
            ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
        );
    }

    async onPointerUp(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;

        let briqs = [];
        for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                    if (!store.state.builderData.currentSet.getAt(x, y, z))
                        briqs.push({ pos: [x, y, z], color: inputStore.currentColor, material: MATERIAL });
        await store.dispatch("builderData/place_briqs", briqs);

        this.fsm.switchTo("place");
    }
}
