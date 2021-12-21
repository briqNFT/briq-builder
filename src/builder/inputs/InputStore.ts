import { reactive } from 'vue';

import { SelectionManager } from './Selection';
import { palettesMgr } from '../Palette';

export const inputStore = reactive({
    currentInput: "place",
    palettesMgr,
    selectionMgr: new SelectionManager(),
    currentColor: palettesMgr.getCurrent().getFirstColor(),
});
