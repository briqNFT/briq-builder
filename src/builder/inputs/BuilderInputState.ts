import { reactive } from 'vue';

import { getCameraRay, voxWorld } from "../graphics/builder.js"
import type { BuilderInputFSM } from './BuilderInput'

export class BuilderInputState
{
    fsm: BuilderInputFSM;
    canvas: HTMLCanvasElement;
    gui: any;
    constructor(fsm : BuilderInputFSM, canvas: HTMLCanvasElement) {
        this.fsm = fsm;
        this.canvas = canvas;
        this.gui = reactive({});
    }

    setGuiData(data: any)
    {
        for (let key in data)
            this.gui[key] = data[key];
    }
    
    // The underscored versions are the generic implementations and must be careful to call super
    // Derived classes don't have to care.
    onEnter(data?: object) {}
    onExit() {}
    _onEnter(data?: object) { this.onEnter(data); }
    _onExit() { this.onExit(); }

    onPointerMove(event: PointerEvent) {}
    onPointerDown(event: PointerEvent) {}
    onPointerUp(event: PointerEvent) {}
    _onPointerMove(event: PointerEvent) { this.onPointerMove(event); }
    _onPointerDown(event: PointerEvent) { this.onPointerDown(event); }
    _onPointerUp(event: PointerEvent) { this.onPointerUp(event); }
}

export class MouseInputState extends BuilderInputState
{
    curX: number = 0;
    curY: number = 0;
    lastX: number = 0;
    lastY: number = 0;

    lastClickX: number = 0;
    lastClickY: number = 0;

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

    override _onPointerMove(event: PointerEvent) {
        this.lastX = this.curX;
        this.lastY = this.curY;
        this.curX = event.clientX;
        this.curY = event.clientY;
        super._onPointerMove(event);
    }

    override _onPointerDown(event: PointerEvent) {
        this.lastClickX = event.clientX;
        this.lastClickY = event.clientY;
        super._onPointerDown(event);
    }

    override _onPointerUp(event: PointerEvent) {
        super._onPointerUp(event);
    }
}
