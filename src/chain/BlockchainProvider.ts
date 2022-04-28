/**
 * Generic, chain-independent abstraction of some things.
 */
class BlockchainProvider {
    provider: any;

    alive = true;

    constructor(p: any) {
        this.provider = p;
        this.provider
            .getContractAddresses()
            .then()
            .catch(() => {
                this.alive = false;
            });
    }

    isAlive() {
        return this.alive;
    }

    getTransactionStatus(tx_hash: string) {
        return this.provider.getTransactionStatus(tx_hash);
    }

    getTransaction(tx_hash: string) {
        return this.provider.getTransaction(tx_hash);
    }
}

import { logDebug } from '@/Messages';
import { reactive, ref, watchEffect } from 'vue';
import { getCurrentNetwork } from './Network';
import { getProvider } from './Provider';

export const blockchainProvider = ref(undefined as undefined | BlockchainProvider);

watchEffect(() => {
    blockchainProvider.value = new BlockchainProvider(getProvider());
    logDebug('SWITCHING BLOCKCHAIN PROVIDER TO ', getCurrentNetwork());
});
