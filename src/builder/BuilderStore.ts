import { markRaw, toRef, watchEffect } from 'vue';

import contractStore from '@/chain/Contracts';
import { createChainBriqs } from '@/builder/ChainBriqs';
import { createChainSets } from '@/builder/ChainSets';

import { setsManager as sm, checkForInitialGMSet, synchronizeSetsLocally } from '@/builder/SetsManager';
import { watchEffectAndWait } from '@/Async';

import { isLoaded as storeIsLoaded } from '@/store/StoreLoading';
import { store } from '@/store/Store';
import { walletInitComplete } from '@/chain/WalletLoading';
import { logDebug } from '@/Messages';
import { setSync } from './SetSync';
import { bookletStore } from '@/components/builder/BookletComposable';

/**
 * Returns refs for easier destructuring.
 * This acts as the 'root' for the builder store,
 * but by itself basically all data is in other objects.
 */
export const useBuilder = (() => {
    const chainBriqs = createChainBriqs();
    const chainSets = createChainSets();
    return () => ({
        store,
        contractStore,
        chainBriqs,
        chainSets,
        setsManager: sm,
    });
})();

async function initializeChainBackend() {
    logDebug('BUILDER INIT - CHAIN BACKEND');
    const { contractStore, setsManager, chainBriqs, chainSets } = useBuilder();

    const walletStore = await walletInitComplete; // Wait until we've completed wallet init (or failed)

    chainBriqs.setAddress(toRef(walletStore, 'userWalletAddress'));
    watchEffect(() => {
        chainBriqs.setContract(contractStore.briq);
    });

    chainSets.watchForChain(contractStore, walletStore);

    setSync.sync(setsManager, chainSets);
}

async function initializeLocalData() {
    const { setsManager } = useBuilder();
    setsManager.clear();
    setsManager.loadFromStorage();
    synchronizeSetsLocally();
}

async function initializeStartSet() {
    const { setsManager } = useBuilder();

    await storeIsLoaded;
    const set = checkForInitialGMSet();
    if (set)
        await store.dispatch('builderData/select_set', set.id);

    const previousSet = window.localStorage.getItem('current_set');
    if (previousSet && setsManager.getInfo(previousSet))
        await store.dispatch('builderData/select_set', previousSet);

    // Must have a local set.
    await watchEffectAndWait(async () => {
        if (
            !store.state.builderData.currentSet ||
            !setsManager.getInfo(store.state.builderData.currentSet.id)
        ) {
            let set = setsManager.getLocalSet();
            if (!set)
                set = setsManager.createLocalSet();
            await store.dispatch('builderData/select_set', set.id);
        }
    });

    logDebug('BUILDER - START SET INITIALIZED');

    // For storage space optimisation, delete non-current chain-only sets.
    for (const sid in setsManager.setsInfo)
        if (store.state.builderData.currentSet.id !== sid && setsManager.setsInfo[sid].isOnChain())
            setsManager.deleteLocalSet(sid);

    watchEffect(() => {
        window.localStorage.setItem('current_set', store.state.builderData.currentSet.id);
    });
}

/**
 * Special case for booklet handling.
 */
async function initializeBooklet() {
    const { setsManager } = useBuilder();
    const setInfo = setsManager.getInfo(store.state.builderData.currentSet.id);
    if (!setInfo.booklet)
        return;
    bookletStore.booklet = setInfo.booklet;
}

async function initializeBuilder() {
    initializeChainBackend();

    await initializeLocalData();

    await initializeStartSet();

    initializeBooklet();

    // Reset history so we start fresh, because at this point other operations have polluted it.
    await store.dispatch('reset_history');
}

// This data is initialised right away when this module is loaded for the first time.
initializeBuilder();
