import { getCameraRay, voxWorld } from "../../builder.js"
import { pickerData } from "../../materials.js"

import { BuilderInputState } from './BuilderInput';
import { previewCube } from '../../PreviewCube'

import { builderData } from '../BuilderData'

import * as THREE from 'three'

export class PlacerInput extends BuilderInputState
{
    curX: number;
    curY: number;
    lastX: number;
    lastY: number;

    lastClickX: number;
    lastClickY: number;

    canvas: HTMLCanvasElement;

    constructor(canvas)
    {
        super();
        this.canvas = canvas;
    }

    getCanvasRelativePosition(x: number, y: number): [number, number]
    {
        const rect = this.canvas.getBoundingClientRect();
        return [
            (this.curX - rect.left) / rect.width * this.canvas.width / rect.width,
            (this.curY - rect.top) / rect.height * this.canvas.height / rect.height
        ]
    }

    onPointerMove(event: PointerEvent)
    {
        this.lastX = this.curX;
        this.lastY = this.curY;
        this.curX = event.clientX;
        this.curY = event.clientY;

        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection)
        {
            const pos = intersection.position.map((v, ndx) => {
                return Math.floor(v + intersection.normal[ndx] * (event.shiftKey ? -0.5 : +0.5));
            });
            if (event.shiftKey)
                previewCube.visible = false;
            else
            {
                previewCube.visible = true;
                previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
                if (Math.abs(pos[0]) <= builderData.currentSet.regionSize / 2 && Math.abs(pos[2]) <= builderData.currentSet.regionSize / 2)
                    (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x002496);
                else
                    (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
            }
        }
    }

    onPointerDown(event: PointerEvent)
    {
        this.lastClickX = event.clientX;
        this.lastClickY = event.clientY;
    }

    onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection)
        {
            const removing = event.shiftKey || event.button !== 0;
            const voxelId = removing ? 0 : pickerData.material;
            // the intersection point is on the face. That means
            // the math imprecision could put us on either side of the face.
            // so go half a normal into the voxel if removing (pickerMaterial = 0)
            // our out of the voxel if adding (pickerMaterial  > 0)
            const pos: [number, number, number] = intersection.position.map((v, ndx) => {
                return Math.floor(v + intersection.normal[ndx] * (removing ? -0.5 : 0.5));
            });
            builderData.currentSet.placeBriq(...pos, voxelId);
        }
    }
}
