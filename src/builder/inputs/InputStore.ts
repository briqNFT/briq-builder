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

    defaultSelectionMethod: 'VOXEL' as ('BOX' | 'VOXEL'),
    showMoveGizmo: true,
    showRotateGizmo: false,
    
    briqOverlayMode: 'KEEP' as ('KEEP' | 'OVERWRITE'),
    
    // If true, a fake element that grabs and stops all events is added to the DOM.
    // Used notably so that selection ignores buttons.
    grabFocus: false,
});
