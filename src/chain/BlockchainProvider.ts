/**
 * Generic, chain-independent abstraction of some things.
 */
import { logDebug } from '@/Messages';
import { ref, watchEffect } from 'vue';

import { Provider } from 'starknet';
import getBaseUrl from '@/url';

import { CHAIN_NETWORKS, getCurrentNetwork } from './Network';
import { TEST_ENV, DEV, APP_ENV } from '@/Meta';

class BlockchainProvider {
    provider: Provider | undefined;

    alive = true;

    constructor(p: any) {
        this.provider = p;
    }

    isAlive() {
        return this.alive;
    }

    async getTransactionStatus(tx_hash: string): Promise<'NOT_RECEIVED' | 'RECEIVED' | 'PENDING' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1' | 'REJECTED'> {
        return (await this.provider?.getTransactionReceipt(tx_hash))?.status || 'NOT_RECEIVED';
    }

    async getTransactionBlock(tx_hash: string) {
        try {
            const data = await this.provider?.getTransactionReceipt(tx_hash);
            return {
                block_number: data!.block_number,
                status: data!.status,
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
        return this.provider?.getTransaction(tx_hash);
    }
}

function getProviderForNetwork(network: CHAIN_NETWORKS): Provider {
    // Forward calls to the backend, itself a proxy for our node provider.
    const testnetProvider = APP_ENV !== 'prod' ?
        new Provider({ rpc: { nodeUrl: `${getBaseUrl()}/v1/node/${network}/rpc`, retries: 2 } }) :
        new Provider({ sequencer: { network: 'goerli-alpha' } });

    return {
        'localhost': new Provider({ sequencer: { baseUrl: 'http://localhost:5050/' } }),
        'starknet-testnet': testnetProvider,
        'starknet-testnet2': new Provider({ sequencer: { baseUrl: 'https://alpha4-2.starknet.io/' } }), //({ network: 'goerli-alpha' }),
        'starknet-mainnet': new Provider({ sequencer: { network: 'mainnet-alpha' } }),
    }[network];
}

export const blockchainProvider = ref(new BlockchainProvider(undefined));

export function getProvider() {
    return blockchainProvider;
}

if (!TEST_ENV)
    watchEffect(() => {
        blockchainProvider.value.provider = getProviderForNetwork(getCurrentNetwork());
        logDebug('SWITCHING BLOCKCHAIN PROVIDER TO ', getCurrentNetwork());
    });
