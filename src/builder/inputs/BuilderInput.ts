import { reactive } from 'vue';

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
