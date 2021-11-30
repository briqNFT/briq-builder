import { getCameraRay, voxWorld } from "../graphics/builder.js"
import { pickerData } from "../../materials.js"

import { MouseInputState, builderInputFsm } from './BuilderInput';
import { previewCube } from '../graphics/PreviewCube'

import { store } from '../../store/Store'

import * as THREE from 'three'

export class EraserInput extends MouseInputState
{
    lastClickPos: [number, number, number] | undefined;
    
    constructor(canvas: HTMLCanvasElement)
    {
        super(canvas);
    }

    onEnter() {
        previewCube.scale.set(1.1, 1.1, 1.1);
        (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
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
            // If the position is on the ground the intersection didn't return a cell.
            if (pos[1] < 0)
                previewCube.visible = false;
            else
            {
                previewCube.visible = true;
                previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
            }
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
                        store.dispatch("builderData/place_briq", { pos: [x, y, z], color: "", voxelId: 0 });
        }
        else
        {
            let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
            const intersection = voxWorld.intersectRay(start, end);
            if (intersection)
            {
                const removing = true;
                const voxelId = 0;
                const pos: [number, number, number] = intersection.position.map((v, ndx) => {
                    return Math.floor(v + intersection.normal[ndx] * (removing ? -0.5 : 0.5));
                });

                if (pos[1] >= 0)
                    store.dispatch("builderData/place_briq", { pos: pos, color: "", voxelId: 0 });
            }
        }
        this.lastClickPos = undefined;
    }
}
