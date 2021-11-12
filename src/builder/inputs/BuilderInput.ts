export class BuilderInputState
{
    constructor() {}
    onPointerMove(event: PointerEvent) {}
    onPointerDown(event: PointerEvent) {}
    onPointerUp(event: PointerEvent) {}
}

class NullState extends BuilderInputState
{
}

export class BuilderInputFSM
{
    state: BuilderInputState;
    constructor()
    {
        this.state = new NullState();
    }

    switchTo(state: BuilderInputState)
    {
        this.state = state;
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
