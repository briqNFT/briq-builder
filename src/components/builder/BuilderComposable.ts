import { builderStore } from '@/builder/BuilderStore';
import { chainBriqs } from '@/builder/ChainBriqs';
import { legacyChainBriqs } from '@/builder/ChainBriqsLegacy';

export function useBuilder() {
    const {
        currentSet,
        currentSetInfo,
        selectSet,
        setsManager,
        resetBuilderState,
    } = builderStore;
    return {
        currentSet,
        currentSetInfo,
        selectSet,
        chainBriqs,
        legacyChainBriqs,
        setsManager,
        resetBuilderState,
    }
}

