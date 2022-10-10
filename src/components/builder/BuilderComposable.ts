import { builderStore } from '@/builder/BuilderStore';
import { chainBriqs } from '@/builder/ChainBriqs';
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
        setsManager,
        resetBuilderState,
    }
}

