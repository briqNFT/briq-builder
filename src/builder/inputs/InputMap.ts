import type { BuilderInputState } from './BuilderInputState';

import { CameraOnlyInput } from './CameraOnly';
import { PlacerInput, PlacerMultiInput } from './Placer';
import { EraserInput, EraserMultiInput } from './Eraser';
import { PainterInput, PainterMultiInput } from './Painter';
import { InspectInput, InspectMultiInput, DragInput } from './Inspect';
import { SelectionBox } from './Selecting';
import { CopyPasteInput } from './CopyPaste';

export const inputMap: { [key: string]: typeof BuilderInputState } = {
    "place": PlacerInput,
    "place_multi": PlacerMultiInput,
    "erase": EraserInput,
    "erase_multi": EraserMultiInput,
    "paint": PainterInput,
    "paint_multi": PainterMultiInput,
    "inspect": InspectInput,
    "inspect_multi": InspectMultiInput,
    "drag": DragInput,
    "camera": CameraOnlyInput,
    "selection_box": SelectionBox,
    "copy_paste": CopyPasteInput
};
