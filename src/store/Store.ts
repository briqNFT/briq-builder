import { createStore } from "vuex";

import { builderDataStore } from "../builder/BuilderData";
import { UndoRedo, undoRedoStore } from "../builder/UndoRedo";

import { DEV } from '../Meta'
import { logDebug } from "../Messages";

export const store = createStore({
    modules: {
        undoRedo: undoRedoStore,
        builderData: builderDataStore,
    },
    plugins: [UndoRedo],
    // Activate strict mode in dev so that we can debug stuff properly.
    strict: DEV
});

import { resolveLoading, isLoaded } from './StoreLoading';

export function setLoaded()
{
    logDebug("VueX Store Loaded");
    resolveLoading();
}

