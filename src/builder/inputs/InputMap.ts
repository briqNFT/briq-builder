import { BuilderInputState } from './input_states/BuilderInputState';

import { NFTPlacerInput, PlacerInput, PlacerMultiInput } from './input_states/Placer';
import { EraserInput, EraserMultiInput } from './input_states/Eraser';
import { PainterInput, PainterMultiInput } from './input_states/Painter';
import { InspectInput, BoxSelect, VASelect, DragInput, RotateInput } from './input_states/Inspect';
import { CopyPasteInput } from './input_states/CopyPaste';
import { CameraInput, CameraSelect } from './input_states/Camera';

/**
 * Map input states to specific FSM states.
 */
export const inputMap: { [key: string]: typeof BuilderInputState } = {
    place: PlacerInput,
    place_multi: PlacerMultiInput,
    place_nft: NFTPlacerInput,
    erase: EraserInput,
    erase_multi: EraserMultiInput,
    paint: PainterInput,
    paint_multi: PainterMultiInput,
    inspect: InspectInput,
    inspect_va: VASelect,
    inspect_box: BoxSelect,
    drag: DragInput,
    rotate: RotateInput,
    copy_paste: CopyPasteInput,

    camera: CameraInput,
    camera_select: CameraSelect,
};
