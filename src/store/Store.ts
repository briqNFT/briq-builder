import { createStore } from "vuex";

import { builderDataStore } from "../builder/BuilderData";
import { walletStore } from "../Wallet";
import { UndoRedo, undoRedoStore } from "../builder/UndoRedo";

import { DEV } from '../Meta'
import { logDebug } from "../Messages";

export const store = createStore({
    modules: {
        undoRedo: undoRedoStore,
        builderData: builderDataStore,
        wallet: walletStore,
    },
    plugins: [UndoRedo],
    // Activate strict mode in dev so that we can debug stuff properly.
    strict: DEV
});

store.dispatch("initialize");

import { resolveLoading, isLoaded } from './StoreLoading';

export function setLoaded()
{
    logDebug("VueX Store Loaded");
    resolveLoading();
}

