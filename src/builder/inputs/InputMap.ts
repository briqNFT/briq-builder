import type { BuilderInputState } from './BuilderInputState';

import { CameraOnlyInput } from './CameraOnly';
import { PlacerInput, PlacerMultiInput } from './Placer';
import { EraserInput, EraserMultiInput } from './Eraser';
import { PainterInput, PainterMultiInput } from './Painter';
import { InspectInput, InspectMultiInput, DragInput, SelectionBox } from './Inspect';
import { MoveInput } from './Move';
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
    "move": MoveInput,
    "selection_box": SelectionBox,
    "copy_paste": CopyPasteInput
};
