import type { BuilderInputState } from './BuilderInputState';

import { CameraOnlyInput } from './input_states/CameraOnly';
import { PlacerInput, PlacerMultiInput } from './input_states/Placer';
import { EraserInput, EraserMultiInput } from './input_states/Eraser';
import { PainterInput, PainterMultiInput } from './input_states/Painter';
import { InspectInput, BoxSelect, VASelect, DragInput } from './input_states/Inspect';
import { CopyPasteInput } from './input_states/CopyPaste';

export const inputMap: { [key: string]: typeof BuilderInputState } = {
    "place": PlacerInput,
    "place_multi": PlacerMultiInput,
    "erase": EraserInput,
    "erase_multi": EraserMultiInput,
    "paint": PainterInput,
    "paint_multi": PainterMultiInput,
    "inspect": InspectInput,
    "inspect_va": VASelect,
    "inspect_box": BoxSelect,
    "drag": DragInput,
    "camera": CameraOnlyInput,
    "copy_paste": CopyPasteInput
};
