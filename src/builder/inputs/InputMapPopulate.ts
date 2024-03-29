import { NFTPlacerInput, PlacerInput, PlacerMultiInput } from './input_states/Placer';
import { EraserInput, EraserMultiInput } from './input_states/Eraser';
import { PainterInput, PainterMultiInput, PainterSprayInput } from './input_states/Painter';
import { InspectInput, BoxSelect, VASelect, DragInput, RotateInput, InspectSprayInput } from './input_states/Inspect';
import { CopyInput, CopyPasteInput } from './input_states/CopyPaste';
import { CameraInput, CameraSelect } from './input_states/Camera';
import { inputMap } from './InputMap';

export function setupInputMap() {
    inputMap.place = PlacerInput;
    inputMap.place_multi = PlacerMultiInput;
    inputMap.place_nft = NFTPlacerInput;
    inputMap.erase = EraserInput;
    inputMap.erase_multi = EraserMultiInput;
    inputMap.paint = PainterInput;
    inputMap.paint_spray = PainterSprayInput;
    inputMap.paint_multi = PainterMultiInput;
    inputMap.inspect = InspectInput;
    inputMap.inspect_spray = InspectSprayInput;
    inputMap.inspect_va = VASelect;
    inputMap.inspect_box = BoxSelect;
    inputMap.drag = DragInput;
    inputMap.rotate = RotateInput;
    inputMap.copy = CopyInput;
    inputMap.copy_paste = CopyPasteInput;

    inputMap.camera = CameraInput;
    inputMap.camera_select = CameraSelect;
}
