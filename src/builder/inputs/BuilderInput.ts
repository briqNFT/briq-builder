import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BuilderInputState } from './BuilderInputState'

import { inputMap } from '../../builder/inputs/InputMap'

import type { inputStore } from './InputStore';

import { reactive } from 'vue';
export class BuilderInputFSM
{
    state!: BuilderInputState;
    canvas!: HTMLCanvasElement;
    orbitControls!: OrbitControls;
    store!: typeof inputStore;

    gui: any;

    initialize(canv: HTMLCanvasElement, oc: OrbitControls, store: typeof inputStore)
    {
        this.canvas = canv;
        this.orbitControls = oc;
        this.store = store;
        this.gui = reactive({});
    }

    switchTo(state: string, data?: object)
    {
        if (this.state)
            this.state._onExit();
        this.state = new inputMap[state](this, this.canvas);
        this.state._onEnter(data);
    }

    //

    async onPointerMove(event: PointerEvent)
    {
        await this.state._onPointerMove(event);
    }

    async onPointerDown(event: PointerEvent)
    {
        await this.state._onPointerDown(event);
    }

    async onPointerUp(event: PointerEvent)
    {
        await this.state._onPointerUp(event);
    }
}

export var builderInputFsm = new BuilderInputFSM();
