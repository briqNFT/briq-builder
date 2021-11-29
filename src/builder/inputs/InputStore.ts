import { reactive } from 'vue';
import { PlacerInput } from './Placer'
import { EraserInput } from './Eraser'
import { PainterInput } from './Painter';

export const inputStore = reactive({
    inputMap: {
        "place": PlacerInput,
        "erase": EraserInput,
        "paint": PainterInput
    },
    currentInput: "place",
});
