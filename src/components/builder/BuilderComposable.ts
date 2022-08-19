import { builderStore } from '@/builder/BuilderStore';
import { chainBriqs } from '@/builder/ChainBriqs';
export function useBuilder() {
    const {
        currentSet,
        currentSetInfo,
        selectSet,
        chainSets,
        setsManager,
    } = builderStore;
    return {
        currentSet,
        currentSetInfo,
        selectSet,
        chainBriqs,
        chainSets,
        setsManager,
    }
}

