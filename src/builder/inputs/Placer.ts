import { getCameraRay, voxWorld } from "../graphics/builder.js"
import { pickerData } from "../../materials.js"

import { BuilderInputState, builderInputFsm } from './BuilderInput';
import { previewCube } from '../graphics/PreviewCube'

import { inputStore } from "./InputStore";

import { store } from '../../store/Store'

import * as THREE from 'three'
import { number } from "starknet";

export class PlacerInput extends BuilderInputState
{
    curX: number;
    curY: number;
    lastX: number;
    lastY: number;

    lastClickX: number;
    lastClickY: number;

    lastClickPos: [number, number, number] | undefined;

    canvas: HTMLCanvasElement;

    constructor(canvas)
    {
        super();
        this.canvas = canvas;
    }

    override onExit()
    {
        builderInputFsm.orbitControls.controls.enabled = true;
    }

    getCanvasRelativePosition(x: number, y: number): [number, number]
    {
        const rect = this.canvas.getBoundingClientRect();
        return [
            (this.curX - rect.left) / rect.width * this.canvas.width / rect.width,
            (this.curY - rect.top) / rect.height * this.canvas.height / rect.height
        ]
    }

    getIntersectionPos(x: number, y: number, overlay = false): number | undefined
    {
        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(x, y));
        const intersection = voxWorld.intersectRay(start, end);
        if (!intersection)
            return undefined;
        return intersection.position.map((v, ndx) => {
            return Math.floor(v + intersection.normal[ndx] * (overlay ? -0.5 : +0.5));
        });
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
                return Math.floor(v + intersection.normal[ndx] * (+0.5));
            });
            if (event.shiftKey && this.lastClickPos)
            {
                previewCube.visible = true;
                previewCube.scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1, Math.abs(this.lastClickPos[1] - pos[1]) + 1, Math.abs(this.lastClickPos[2] - pos[2]) + 1);
                previewCube.position.set(
                    ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
                    ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
                    ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
                );
            }
            else
            {
                previewCube.visible = true;
                previewCube.scale.set(1, 1, 1);
                previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
                if (Math.abs(pos[0]) <= store.state.builderData.currentSet.regionSize / 2 && Math.abs(pos[2]) <= store.state.builderData.currentSet.regionSize / 2)
                    (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.colorMap[inputStore.currentColor].color);
                else
                    (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(0x962400);
            }
        }
    }

    onPointerDown(event: PointerEvent)
    {
        this.lastClickX = event.clientX;
        this.lastClickY = event.clientY;

        if (event.shiftKey)
        {
            builderInputFsm.orbitControls.controls.enabled = false;
            this.lastClickPos = this.getIntersectionPos(event.clientX, event.clientY);
        }
    }

    onPointerUp(event: PointerEvent)
    {
        builderInputFsm.orbitControls.controls.enabled = true;

        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (!this.lastClickPos && mov > 10)
            return;
        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection)
        {
            let pos = intersection.position.map((v, ndx) => {
                return Math.floor(v + intersection.normal[ndx] * 0.5);
            });

            if (event.shiftKey && this.lastClickPos)
            {
                previewCube.visible = true;
                previewCube.scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1, Math.abs(this.lastClickPos[1] - pos[1]) + 1, Math.abs(this.lastClickPos[2] - pos[2]) + 1);
                previewCube.position.set(
                    ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
                    ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
                    ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
                );
                for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
                    for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                        for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                            store.dispatch("builderData/place_briq", { pos: [x, y, z], color: inputStore.colorMap[inputStore.currentColor].color, voxelId: pickerData.material });            
            }
            else
            {
                const removing = event.button !== 0;
                if (removing)
                    // the intersection point is on the face. That means
                    // the math imprecision could put us on either side of the face.
                    // so go half a normal into the voxel if removing (pickerMaterial = 0)
                    // our out of the voxel if adding (pickerMaterial  > 0)
                    pos = intersection.position.map((v, ndx) => {
                        return Math.floor(v + intersection.normal[ndx] * (removing ? -0.5 : 0.5));
                    });
                const voxelId = removing ? 0 : pickerData.material;
                store.dispatch("builderData/place_briq", { pos: pos, color: removing ? '' : inputStore.colorMap[inputStore.currentColor].color, voxelId: voxelId });
            }
        }
        this.lastClickPos = undefined;
    }
}
