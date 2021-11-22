import { createStore } from "vuex";

import { builderDataStore } from "../builder/BuilderData";
import { walletStore } from "../Wallet";
import { UndoRedo, undoRedoStore } from "../builder/UndoRedo";

export const store = createStore({
    modules: {
        undoRedo: undoRedoStore,
        builderData: builderDataStore,
        wallet: walletStore,
    },
    plugins: [UndoRedo],
    // Activate strict mode in dev so that we can debug stuff properly.
    strict: import.meta.env.DEV
});

store.dispatch("initialize");
