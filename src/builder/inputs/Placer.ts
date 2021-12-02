import { pickerData } from "../../materials.js"
import { MouseInputState } from './BuilderInputState';
import { previewCube } from '../graphics/PreviewCube'
import { inputStore } from "./InputStore";
import { store } from '../../store/Store'

import { cellSize } from '../../builder/Constants';

import * as THREE from 'three'

export class PlacerInput extends MouseInputState
{
    onEnter()
    {
        previewCube.visible = true;
        previewCube.scale.set(1, 1, 1);
    }
    
    onExit()
    {
        previewCube.visible = false;
    }

    onPointerMove(event: PointerEvent)
    {
        const pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;
        previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        if (Math.abs(pos[0]) <= cellSize && Math.abs(pos[2]) <= cellSize)
            (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.colorMap[inputStore.currentColor].color);
        else
            (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("place_multi", { x: event.clientX, y: event.clientY });
    }

    onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        
        const removing = event.button !== 0;
        const pos = this.getIntersectionPos(this.curX, this.curY, removing);
        if (!pos)
            return;
        const voxelId = removing ? 0 : pickerData.material;
        store.dispatch("builderData/place_briq", { pos: pos, color: removing ? '' : inputStore.colorMap[inputStore.currentColor].color, voxelId: voxelId });
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
        previewCube.visible = true;
    }

    onExit() {
        previewCube.visible = false;
        this.fsm.orbitControls.enabled = true;
    }

    onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;

        previewCube.scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1, Math.abs(this.lastClickPos[1] - pos[1]) + 1, Math.abs(this.lastClickPos[2] - pos[2]) + 1);
        previewCube.position.set(
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
                        briqs.push({ pos: [x, y, z], color: inputStore.colorMap[inputStore.currentColor].color, voxelId: pickerData.material });
        await store.dispatch("builderData/place_multiple_briqs", briqs);

        this.fsm.switchTo("place");
    }
}
