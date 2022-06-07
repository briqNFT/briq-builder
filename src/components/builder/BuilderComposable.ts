import { reactive, toRef, watchEffect } from 'vue';

import { walletStore2 } from '@/chain/Wallet';
import contractStore from '@/chain/Contracts';
import { createChainBriqs } from '../../builder/ChainBriqs';

import { setsManager, checkForInitialGMSet } from '../../builder/SetsManager';
import { watchEffectAndWait } from '../../Async';

import { inputInitComplete } from '@/builder/inputs/InputLoading';

import { isLoaded as storeIsLoaded } from '@/store/StoreLoading';
import { store } from '@/store/Store';

const builderDataStore = reactive({
    chainBriqs: createChainBriqs(),
});

async function initializeBuilder() {
    await storeIsLoaded;
    setsManager.clear();
    setsManager.loadFromStorage();
    await inputInitComplete;
    let set = checkForInitialGMSet();
    if (set)
        await store.dispatch('builderData/select_set', set.id);

    let previousSet = window.localStorage.getItem('current_set');
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

    // For storage space optimisation, delete non-current chain-only sets.
    for (let sid in setsManager.setsInfo)
        if (store.state.builderData.currentSet.id !== sid && setsManager.setsInfo[sid].isOnChain())
            setsManager.deleteLocalSet(sid);

    // Reset history so we start fresh.
    await store.dispatch('reset_history');

    watchEffect(() => {
        window.localStorage.setItem('current_set', store.state.builderData.currentSet.id);
    });

    // TODO: centralise these?
    setsManager.watchForChain(contractStore, walletStore2);

    builderDataStore.chainBriqs.setAddress(toRef(walletStore2, 'userWalletAddress'));
    watchEffect(() => {
        builderDataStore.chainBriqs.setContract(contractStore.briq);
    });
}

initializeBuilder();

export function useBuilder() {
    return {
        chainBriqs: builderDataStore.chainBriqs,
    }
}