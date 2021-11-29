import { getCameraRay, voxWorld } from "../graphics/builder.js"
import { pickerData } from "../../materials.js"

import { BuilderInputState } from './BuilderInput';
import { previewCube } from '../graphics/PreviewCube'

import { currentColor, colorMap } from '../../components/builder/PickColor.vue'

import { store } from '../../store/Store'

import * as THREE from 'three'

export class PainterInput extends BuilderInputState
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

    onEnter() {
        previewCube.scale.set(1.1, 1.1, 1.1);
    }
    onExit() {
        previewCube.scale.set(1, 1, 1);
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
                return Math.floor(v + intersection.normal[ndx] * (-0.5));
            });
            if (pos[1] < 0)
                previewCube.visible = false;
            else
            {
                previewCube.visible = true;
                previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
                (previewCube.material as THREE.MeshPhongMaterial).color = new THREE.Color(colorMap[currentColor.value].color);
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
            const pos: [number, number, number] = intersection.position.map((v, ndx) => {
                return Math.floor(v + intersection.normal[ndx] * (-0.5));
            });
            if (pos[1] >= 0)
                store.dispatch("builderData/set_briq_color", { pos: pos, color: colorMap[currentColor.value].color });
        }
    }
}
