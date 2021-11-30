import { getCameraRay, voxWorld } from "../graphics/builder.js"
import { pickerData } from "../../materials.js"

import { MouseInputState, builderInputFsm } from './BuilderInput';
import { previewCube } from '../graphics/PreviewCube'

import { inputStore } from "./InputStore";

import { store } from '../../store/Store'

import * as THREE from 'three'

export class PainterInput extends MouseInputState
{
    lastClickPos: [number, number, number] | undefined;

    constructor(canvas)
    {
        super(canvas);
    }

    onEnter() {
        previewCube.scale.set(1.1, 1.1, 1.1);
    }

    onExit() {
        previewCube.scale.set(1, 1, 1);
    }

    onPointerMove(event: PointerEvent)
    {
        super.onPointerMove(event);

        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        if (event.shiftKey && this.lastClickPos)
        {
            previewCube.visible = true;
            previewCube.scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1.1, Math.abs(this.lastClickPos[1] - pos[1]) + 1.1, Math.abs(this.lastClickPos[2] - pos[2]) + 1.1);
            previewCube.position.set(
                ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
                ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
                ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
            );
        }
        else
        {
            previewCube.scale.set(1.1, 1.1, 1.1);
            previewCube.visible = true;
            previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
            (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.colorMap[inputStore.currentColor].color);
        }
    }

    onPointerDown(event: PointerEvent)
    {
        super.onPointerDown(event);
        if (event.shiftKey)
        {
            builderInputFsm.orbitControls.controls.enabled = false;
            this.lastClickPos = this.getIntersectionPos(event.clientX, event.clientY, true);
        }
    }

    onPointerUp(event: PointerEvent)
    {
        builderInputFsm.orbitControls.controls.enabled = true;

        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (!this.lastClickPos && mov > 10)
            return;
        
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        previewCube.visible = false;

        if (event.shiftKey && this.lastClickPos)
        {
            for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
                for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                    for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                    {
                        if (store.state.builderData.currentSet.getAt(x, y, z))
                            store.dispatch("builderData/set_briq_color", { pos: [x, y, z], color: inputStore.colorMap[inputStore.currentColor].color });
                    }
        }
        else
        {
            if (pos[1] >= 0)
                store.dispatch("builderData/set_briq_color", { pos: pos, color: inputStore.colorMap[inputStore.currentColor].color });
        }
        this.lastClickPos = undefined;
    }
}
