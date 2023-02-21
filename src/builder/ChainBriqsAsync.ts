import { computed, ref } from 'vue';
import type { ChainBriqs } from './ChainBriqs';

const chainBriqsStore = ref(undefined);
export const maybeChainBriqs = computed<ChainBriqs | undefined>(() => {
    return chainBriqsStore.value?.current;
})
export function setChainBriqsStoreComplete(chainsPerUser: any) {
    chainBriqsStore.value = chainsPerUser;
}

// Load the dispatch.
// The assumption is that any file actually loading this module will want this code.
import('@/Dispatch');
