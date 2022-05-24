import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuilderInputState, MouseInputState } from './input_states/BuilderInputState';

import { inputMap } from '../../builder/inputs/InputMap';

import type { inputStore } from './InputStore';
import type { HotkeyManager } from '../../Hotkeys';

import { reactive } from 'vue';
import { inputInitComplete, setInputInitComplete } from './InputLoading';

export class BuilderInputFSM {
    state!: BuilderInputState;
    canvas!: HTMLCanvasElement;
    orbitControls!: OrbitControls;
    store!: typeof inputStore;
    hotkeyMgr!: HotkeyManager;

    gui: any = reactive({});

    _initialisePromise: any;

    initialize(canv: HTMLCanvasElement, oc: OrbitControls, store: typeof inputStore, hotkeyMgr: HotkeyManager) {
        this.canvas = canv;
        this.orbitControls = oc;
        this.store = store;
        this.hotkeyMgr = hotkeyMgr;
        setInputInitComplete();
    }

    switchTo(state: string, data?: object) {
        if (this.state)
            this.state._onExit();
        const oldState = this.state;
        this.state = new inputMap[state](this, this.canvas);
        if (this.state instanceof MouseInputState && oldState instanceof MouseInputState) {
            this.state.curX = oldState.curX;
            this.state.curY = oldState.curY;
            this.state.lastX = oldState.lastX;
            this.state.lastY = oldState.lastY;
        }
        this.state._onEnter(data);
        this.store.currentInput = state;
    }

    waitForInit() {
        return inputInitComplete;
    }

    //

    async onFrame() {
        if (this.state)
            await this.state._onFrame();
    }

    async onPointerMove(event: PointerEvent) {
        await this.state._onPointerMove(event);
    }

    async onPointerDown(event: PointerEvent) {
        await this.state._onPointerDown(event);
    }

    async onPointerUp(event: PointerEvent) {
        await this.state._onPointerUp(event);
    }
}

export var builderInputFsm = new BuilderInputFSM();
