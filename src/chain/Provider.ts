import { Provider } from 'starknet';

import { getCurrentNetwork } from './Network';

export function getProvider(): Provider
{
    return {
        "localhost": new Provider({ baseUrl: "http://localhost:5000" }),
        "starknet-testnet": new Provider({ network: 'goerli-alpha' }),
        "starknet-testnet-legacy": new Provider({ network: 'goerli-alpha' }),
        "starknet-mainnet": new Provider({ network: 'mainnet-alpha' }),
    }[getCurrentNetwork()];
}


export function getProviderForNetwork(network: any): Provider
{
    return new Provider({ network });
}
