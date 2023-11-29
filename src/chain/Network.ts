import { reactive } from 'vue';
import { APP_ENV } from '@/Meta';
import { logDebug } from '@/Messages';
import { MIGRATION_ENABLED } from '@/MigrationData';

/**
 * Sort of an abstraction around the idea of a chain + network.
 */

export type CHAIN_NETWORKS = 'localhost' | 'starknet-testnet' | 'starknet-testnet-dojo' | 'starknet-mainnet' | 'starknet-mainnet-dojo';

const network = reactive({
    network: (MIGRATION_ENABLED ?
        APP_ENV === 'prod' ? 'starknet-mainnet-dojo' : 'starknet-testnet-dojo' :
        APP_ENV === 'prod' ? 'starknet-mainnet' : 'starknet-testnet'
    ) as CHAIN_NETWORKS,
});

export function getNetworkName(network: CHAIN_NETWORKS) {
    return {
        'localhost': 'Localhost',
        'starknet-testnet': 'Starknet Testnet',
        'starknet-testnet-dojo': 'Starknet Testnet',
        'starknet-mainnet': 'Starknet Mainnet',
        'starknet-mainnet-dojo': 'Starknet Mainnet',
    }[network];
}

export function getPremigrationNetwork(network: CHAIN_NETWORKS) {
    return {
        'starknet-testnet-dojo': 'starknet-testnet',
        'starknet-mainnet-dojo': 'starknet-mainnet',
    }?.[network] || undefined;
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
        'starknet-mainnet-dojo': '0x534e5f4d41494e',
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
