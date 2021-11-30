import { getCameraRay, voxWorld } from "../graphics/builder.js"
import { pickerData } from "../../materials.js"

import { BuilderInputState } from './BuilderInput';
import { previewCube } from '../graphics/PreviewCube'

import { store } from '../../store/Store'

import type { SetData } from '../SetData'

import * as THREE from 'three'
import { number } from "starknet";

export class InspectInput extends BuilderInputState
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
        super({
            briq: undefined,
            curX: 0,
            curY: 0,
        });
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

        this.gui.curX = this.curX;
        this.gui.curY = this.curY;

        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection)
        {
            const pos: [number, number, number] = intersection.position.map((v, ndx) => {
                return Math.floor(v + intersection.normal[ndx] * (-0.5));
            });
            // If the position is on the ground then there's no cube, and vice-versa.
            if (pos[1] < 0)
                this.gui.briq = undefined;
            else
            {
                this.gui.briq = (store.state.builderData.currentSet as SetData).getAt(...pos);
            }
        }
    }
}
