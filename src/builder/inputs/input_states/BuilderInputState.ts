import builderSettings from '../../graphics/Settings';
import { getIntersectionPos } from '../../graphics/SetRendering';
import type { BuilderInputFSM } from '../BuilderInput';

export class BuilderInputState {
    fsm: BuilderInputFSM;
    canvas: HTMLCanvasElement;

    constructor(fsm: BuilderInputFSM, canvas: HTMLCanvasElement) {
        this.fsm = fsm;
        this.canvas = canvas;
        this.gui = fsm.gui;
        for (const key in this.gui)
            delete this.gui[key];
    }

    setGuiData(data: any) {
        for (const key in data)
            this.gui[key] = data[key];
    }

    // The underscored versions are the generic implementations and must be careful to call super
    // Derived classes don't have to care.
    onEnter(data?: object) {}
    onExit() {}
    _onEnter(data?: object) {
        this.onEnter(data);
    }
    _onExit() {
        this.onExit();
    }

    async onFrame() {}
    async onPointerMove(event: PointerEvent) {}
    async onPointerDown(event: PointerEvent) {}
    async onPointerUp(event: PointerEvent) {}
    async _onFrame() {
        await this.onFrame();
    }
    async _onPointerMove(event: PointerEvent) {
        await this.onPointerMove(event);
    }
    async _onPointerDown(event: PointerEvent) {
        await this.onPointerDown(event);
    }
    async _onPointerUp(event: PointerEvent) {
        await this.onPointerUp(event);
    }
}

export class MouseInputState extends BuilderInputState {
    curX = 0;
    curY = 0;
    lastX = 0;
    lastY = 0;

    lastClickX = 0;
    lastClickY = 0;

    getCanvasRelativePosition(x: number, y: number): [number, number] {
        const rect = this.canvas.getBoundingClientRect();
        return [
            (((this.curX - rect.left) / rect.width) * this.canvas.width) / rect.width,
            (((this.curY - rect.top) / rect.height) * this.canvas.height) / rect.height,
        ];
    }

    _getIntersectionPos(x: number, y: number, overlay = false) {
        return getIntersectionPos(...this.getCanvasRelativePosition(x, y));
    }

    getIntersectionPos(x: number, y: number, overlay = false): [number, number, number] | undefined {
        const intersection = this._getIntersectionPos(x, y, overlay);
        if (!intersection)
            return undefined;
        return intersection.position.map((v, ndx) => {
            return Math.floor(v + intersection.normal[ndx] * (overlay ? -0.5 : +0.5));
        });
    }

    canvasSize() {
        return builderSettings.canvasSize;
    }

    isWithinBounds(x: number, y: number, z: number) {
        const size = builderSettings.canvasSize;
        return x >= -size && x < size && z >= -size && z < size && y >= 0;
    }

    clampToBounds(x: number, y: number, z: number): [number, number, number] {
        x =
            x < -builderSettings.canvasSize
                ? -builderSettings.canvasSize
                : x >= builderSettings.canvasSize
                    ? +builderSettings.canvasSize - 1
                    : x;
        z =
            z < -builderSettings.canvasSize
                ? -builderSettings.canvasSize
                : z >= builderSettings.canvasSize
                    ? +builderSettings.canvasSize - 1
                    : z;
        return [x, Math.max(y, 0), z];
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
