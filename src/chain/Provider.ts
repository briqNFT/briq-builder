import { Provider } from 'starknet';
import getBaseUrl from '@/url';

import { CHAIN_NETWORKS, getCurrentNetwork } from './Network';

export function getProvider(): Provider {
    return getProviderForNetwork(getCurrentNetwork());
}

export function getProviderForNetwork(network: CHAIN_NETWORKS): Provider {
    return {
        'mock': new Provider({ sequencer: { baseUrl: getBaseUrl() + '/mock_chain' } }),
        'localhost': new Provider({ sequencer: { baseUrl: 'http://localhost:5050' } }),
        'starknet-testnet': new Provider({ sequencer: { baseUrl: 'https://alpha4-2.starknet.io/' } }), //({ network: 'goerli-alpha' }),
        'starknet-testnet-legacy': new Provider({ sequencer: { network: 'goerli-alpha' } }),
        'starknet-mainnet': new Provider({ sequencer: { network: 'mainnet-alpha' } }),
    }[network];
}