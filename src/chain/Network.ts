import { reactive } from 'vue';
import { APP_ENV } from '@/Meta';
import { logDebug } from '@/Messages';

/**
 * Sort of an abstraction around the idea of a chain + network.
 */

export type CHAIN_NETWORKS = 'localhost' | 'starknet-testnet' | 'starknet-testnet-dojo' | 'starknet-mainnet';

const network = reactive({
    network: APP_ENV === 'prod' ? 'starknet-mainnet' : 'starknet-testnet-dojo' as CHAIN_NETWORKS,
});

export function getNetworkName(network: CHAIN_NETWORKS) {
    return {
        'localhost': 'Localhost',
        'starknet-testnet': 'Starknet Testnet',
        'starknet-testnet-dojo': 'Starknet Testnet',
        'starknet-mainnet': 'Starknet Mainnet',
    }[network];
}

export function getCurrentNetwork(nohack = false) {
    if (!nohack && APP_ENV === 'prod')
        return 'starknet-mainnet';
    return network.network;
}


export function getChainIdFromNetwork(network: CHAIN_NETWORKS): string {
    return {
        'localhost': '0xdead',
        'starknet-testnet': '0x534e5f474f45524c49',
        'starknet-testnet-dojo': '0x534e5f474f45524c49',
        'starknet-mainnet': '0x534e5f4d41494e',
    }[network];
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
