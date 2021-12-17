import type { BuilderInputState } from './BuilderInputState';

import { CameraOnlyInput } from './CameraOnly';
import { PlacerInput, PlacerMultiInput } from './Placer';
import { EraserInput, EraserMultiInput } from './Eraser';
import { PainterInput, PainterMultiInput } from './Painter';
import { InspectInput } from './Inspect';
import { MoveInput } from './Move';

export const inputMap: { [key: string]: typeof BuilderInputState } = {
    "place": PlacerInput,
    "place_multi": PlacerMultiInput,
    "erase": EraserInput,
    "erase_multi": EraserMultiInput,
    "paint": PainterInput,
    "paint_multi": PainterMultiInput,
    "inspect": InspectInput,
    "camera": CameraOnlyInput,
    "move": MoveInput
};
