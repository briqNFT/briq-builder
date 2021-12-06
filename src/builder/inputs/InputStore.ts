import { reactive } from 'vue';

import { palettesMgr } from '../Palette';

export const inputStore = reactive({
    currentInput: "place",
    palettesMgr,
    currentColor: palettesMgr.getCurrent().getFirstColor(),
});
