import { computed, shallowReadonly, shallowRef } from 'vue';

import contractStore from '@/chain/Contracts';

import { setsManager as sm } from '@/builder/SetsManager';

import type { SetData } from './SetData';
import { inputStore } from '@/builder/inputs/InputStore';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { dispatchBuilderAction } from './graphics/Dispatch';
import { logDebug } from '@/Messages';

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

    const selectSet = async (set: SetData) => {
        logDebug('BUILDER - SWITCHING TO SET ', set.id);
        _currentSet.value = set;
        inputStore.selectionMgr.selectSet(currentSet.value);

        const isLocal = sm.getInfo(currentSet.value?.id);
        builderInputFsm.switchTo(isLocal ? 'place' : 'camera');

        dispatchBuilderAction('select_set', currentSet.value);
    }

    const resetBuilderState = () => {
        _currentSet.value = undefined;
    }

    return {
        currentSetInfo,
        currentSet,
        selectSet,
        contractStore,
        setsManager: sm,
        resetBuilderState,
    };
})();
