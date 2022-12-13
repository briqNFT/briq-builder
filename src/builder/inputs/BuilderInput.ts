import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BuilderInputState } from './input_states/BuilderInputState';

import { inputMap } from '../../builder/inputs/InputMap';

import type { inputStore } from './InputStore';
import type { HotkeyManager } from '../../Hotkeys';

import { reactive } from 'vue';
import { inputInitComplete, setInputInitComplete } from './InputLoading';
import { logDebug } from '@/Messages';

export class BuilderInputFSM {
    state!: BuilderInputState;
    canvas!: HTMLCanvasElement;
    orbitControls!: OrbitControls;
    store!: typeof inputStore;
    hotkeyMgr!: HotkeyManager;

    gui: any = reactive({});

    _initialisePromise: any;

    _preinitState: any;

    initialize(canv: HTMLCanvasElement, oc: OrbitControls, store: typeof inputStore, hotkeyMgr: HotkeyManager) {
        this.canvas = canv;
        this.orbitControls = oc;
        this.store = store;
        this.hotkeyMgr = hotkeyMgr;
        logDebug('FSM - initialised');
        setInputInitComplete.value();
        if (this._preinitState)
            this.switchTo(...this._preinitState);
    }

    deinit() {
        if (this.state)
            this.state._onExit();
        // This leaves us in an invalid state but that's fine.
        this.state = null;
    }

    switchTo(state: string, data?: object) {
        // We might be called before we're initialised, so just remember the latest call for convenience.
        if (!this.store) {
            this._preinitState = [state, data];
            return;
        }
        if (this.state)
            this.state._onExit();
        const oldState = this.state;
        this.state = new inputMap[state](this, this.canvas);
        this.state._copyOver(oldState);
        this.store.currentInput = state;
        this.state._onEnter(data);
    }

    waitForInit() {
        return inputInitComplete.value;
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
