import { reactive } from 'vue';
import { APP_ENV } from '@/Meta';
import { logDebug } from '@/Messages';

/**
 * Sort of an abstraction around the idea of a chain + network.
 */

export type CHAIN_NETWORKS = 'mock' | 'localhost' | 'starknet-testnet' | 'starknet-testnet-legacy' | 'starknet-mainnet';

const network = reactive({
    network: 'starknet-testnet' as CHAIN_NETWORKS,
});

export function getNetworkName(network: CHAIN_NETWORKS) {
    return {
        'mock': 'Mock',
        'localhost': 'Localhost',
        'starknet-testnet': 'Starknet Testnet',
        'starknet-testnet-legacy': 'Legacy testnet',
        'starknet-mainnet': 'Starknet Mainnet',
    }[network];
}

export function getCurrentNetwork() {
    return network.network;
}

export function setNetwork(networkName: CHAIN_NETWORKS) {
    network.network = networkName;
}

export async function chooseDefaultNetwork() {
    if (APP_ENV === 'dev')
        try {
            await fetch('http://localhost:5050/is_alive');
            network.network = 'localhost';
            logDebug('Switching to local provider');
        } catch (_) {}

}
