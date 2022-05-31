import { BoxSelect, InspectOnlyInput } from "./Inspect";

export class CameraInput extends InspectOnlyInput {
    async onPointerDown(event: PointerEvent) {
        if (event.altKey || event.shiftKey) {
            this.fsm.switchTo('camera_select', { switchBackTo: 'camera', x: event.clientX, y: event.clientY });
            return;
        }
    }
}

export class CameraSelect extends BoxSelect {
    onEnter(data: any) {
        super.onEnter(data);
        this.switchBackTo = 'camera';
    }
}
