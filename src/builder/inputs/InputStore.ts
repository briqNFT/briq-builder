import { reactive } from 'vue';

import { SelectionManager } from './Selection';
import { palettesMgr } from '../Palette';

export const inputStore = reactive({
    currentInput: "place",
    // If true, the input mode is forced & the user can't change it (used for some 'tools' such as screenshotting)
    forceInput: false,
    palettesMgr,
    selectionMgr: new SelectionManager(),
    currentColor: palettesMgr.getCurrent().getFirstColor(),
});
