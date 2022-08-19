import { computed, shallowReadonly, shallowRef } from 'vue';

import contractStore from '@/chain/Contracts';
import { createChainSets } from '@/builder/ChainSets';

import { setsManager as sm, setsManager } from '@/builder/SetsManager';

import { store } from '@/store/Store';
import { SetData } from './SetData';
import { inputStore } from '@/builder/inputs/InputStore';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { dispatchBuilderAction } from './graphics/Dispatch';
import { currentSet as ___currentSet } from './BuilderData';

/**
 * A lot of components in a number of places need to access the 'current set' loaded in the builder.
 * This makes load order of files rather tricky, because this needs to be loaded super early.
 * The file layout is designed so that this isn't too clunky.
 */
export const builderStore = (() => {
    const currentSetInfo = computed(() => {
        return sm.getInfo(currentSet.value?.id);
    });
    const _currentSet = shallowRef(undefined as unknown as SetData);
    const currentSet = shallowReadonly(_currentSet);
    const chainSets = createChainSets();

    const selectSet = async (setId: string) => {
        const info = setsManager.getInfo(setId);
        const set = info.getSet();
        if (!set)
            throw new Error('Could not find local set with ID ' + setId);
        _currentSet.value = set;
        inputStore.selectionMgr.selectSet(currentSet.value);
        ___currentSet.value = set;
        if (builderInputFsm.store)
            builderInputFsm.switchTo('place');
        dispatchBuilderAction('select_set', currentSet.value);
    }
    return {
        currentSetInfo,
        currentSet,
        selectSet,
        store,
        contractStore,
        chainSets,
        setsManager: sm,
    };
})();
