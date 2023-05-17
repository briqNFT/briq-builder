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

    async getTransactionStatus(tx_hash: string): Promise<'NOT_RECEIVED' | 'RECEIVED' | 'PENDING' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1' | 'REJECTED'> {
        return (await this.provider.getTransactionReceipt(tx_hash))?.status || 'NOT_RECEIVED';
    }

    async getTransactionBlock(tx_hash: string) {
        try {
            const data = (await (await fetch(`${this.provider.provider.feederGatewayUrl}/get_transaction?transactionHash=${tx_hash}`)).json());
            return {
                block_number: data.block_number,
                status: data.status,
            }
        } catch (_) {
            // Fail in a safe-way for calling code.
            return {
                block_number: undefined,
                status: 'NOT_RECEIVED',
            };
        }
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
