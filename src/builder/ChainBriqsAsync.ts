import { computed, ref } from 'vue';
import type { ChainBriqs } from './ChainBriqs';
import type { LegacyChainBriqs } from './ChainBriqsLegacy';

const chainBriqsStore = ref(undefined);
export const maybeChainBriqs = computed<ChainBriqs | undefined>(() => {
    return chainBriqsStore.value?.current;
})

// Defined here to avoid import issues
export class NotEnoughBriqs extends Error {
    material: string;
    constructor(material: string) {
        super(`Not enough Briqs with material ${material}`);
        this.material = material;
    }
}


// Temporary, for the migration.
export const maybeLegacyBriqs = ref(undefined as undefined | LegacyChainBriqs);

export function setChainBriqsStoreComplete(chainsPerUser: any, legacyBriqsPerUser: any) {
    chainBriqsStore.value = chainsPerUser;
    maybeLegacyBriqs.value = legacyBriqsPerUser;
}

// Load the dispatch.
// The assumption is that any file actually loading this module will want this code.
import('@/Dispatch');
