/**
 * Generic, chain-independent abstraction of some things.
 */
class BlockchainProvider {
    provider: any;

    alive = true;

    constructor(p: any) {
        this.provider = p;
    }

    isAlive() {
        return this.alive;
    }

    getTransactionStatus(tx_hash: string): 'NOT_RECEIVED' | 'RECEIVED' | 'PENDING' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1' | 'REJECTED' {
        return this.provider.getTransactionStatus(tx_hash)?.tx_status || 'NOT_RECEIVED';
    }

    getTransaction(tx_hash: string) {
        return this.provider.getTransaction(tx_hash);
    }
}

import { logDebug } from '@/Messages';
import { ref, watchEffect } from 'vue';
import { getCurrentNetwork } from './Network';
import { getProvider } from './Provider';

export const blockchainProvider = ref(undefined as undefined | BlockchainProvider);

watchEffect(() => {
    blockchainProvider.value = new BlockchainProvider(getProvider());
    logDebug('SWITCHING BLOCKCHAIN PROVIDER TO ', getCurrentNetwork());
});
