import type { BuilderInputState } from './BuilderInputState';

import { CameraOnlyInput } from './CameraOnly';
import { PlacerInput, PlacerMultiInput } from './Placer';
import { EraserInput, EraserMultiInput } from './Eraser';
import { PainterInput, PainterMultiInput } from './Painter';
import { InspectInput, BoxSelect, VASelect, DragInput } from './Inspect';
import { CopyPasteInput } from './CopyPaste';

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
