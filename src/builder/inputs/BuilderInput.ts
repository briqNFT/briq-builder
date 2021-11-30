import { number } from 'starknet';
import { reactive } from 'vue';

import { getCameraRay, voxWorld } from "../graphics/builder.js"

export class BuilderInputState
{
    gui: any;
    constructor(guiState: any = {}) {
        this.gui = reactive(guiState);
    }

    onEnter() {}
    onExit() {}

    onPointerMove(event: PointerEvent) {}
    onPointerDown(event: PointerEvent) {}
    onPointerUp(event: PointerEvent) {}
}


export class MouseInputState extends BuilderInputState
{
    curX: number = 0;
    curY: number = 0;
    lastX: number = 0;
    lastY: number = 0;

    lastClickX: number = 0;
    lastClickY: number = 0;

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, guiState: any = {}) {
        super(guiState);
        this.canvas = canvas;
    }

    onEnter() {}
    onExit() {}

    getCanvasRelativePosition(x: number, y: number): [number, number]
    {
        const rect = this.canvas.getBoundingClientRect();
        return [
            (this.curX - rect.left) / rect.width * this.canvas.width / rect.width,
            (this.curY - rect.top) / rect.height * this.canvas.height / rect.height
        ]
    }

    getIntersectionPos(x: number, y: number, overlay = false): [number, number, number] | undefined
    {
        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(x, y));
        const intersection = voxWorld.intersectRay(start, end);
        if (!intersection)
            return undefined;
        return intersection.position.map((v, ndx) => {
            return Math.floor(v + intersection.normal[ndx] * (overlay ? -0.5 : +0.5));
        });
    }

    onPointerMove(event: PointerEvent) {
        this.lastX = this.curX;
        this.lastY = this.curY;
        this.curX = event.clientX;
        this.curY = event.clientY;
    }

    onPointerDown(event: PointerEvent) {
        this.lastClickX = event.clientX;
        this.lastClickY = event.clientY;
    }

    onPointerUp(event: PointerEvent) {
    }
}


class NullState extends BuilderInputState
{
}

import { orbitControls } from '../graphics/builder.js'

class BuilderInputFSM
{
    state: BuilderInputState;
    orbitControls = orbitControls;
    constructor()
    {
        this.state = new NullState();
    }

    switchTo(state: BuilderInputState)
    {
        if (this.state)
            this.state.onExit();
        this.state = state;
        this.state.onEnter();
    }

    //

    onPointerMove(event: PointerEvent)
    {
        this.state.onPointerMove(event);
    }

    onPointerDown(event: PointerEvent)
    {
        this.state.onPointerDown(event);
    }

    onPointerUp(event: PointerEvent)
    {
        this.state.onPointerUp(event);
    }
}

export var builderInputFsm = new BuilderInputFSM();
