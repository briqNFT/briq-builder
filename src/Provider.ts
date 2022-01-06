import { Provider } from 'starknet';

import { PROD } from './Meta'

// TODO: import from starknet?
type NetworkName = 'mainnet-alpha' | 'goerli-alpha';

export var provider: undefined | Provider;

var providerPromise: undefined | Promise<Provider>;
var onProvider: undefined | CallableFunction;

export function getProviderForNetwork(network: NetworkName): Provider
{
    return new Provider({ network });
}

export function getProvider(): Promise<Provider>
{
    if (!providerPromise)
        providerPromise = new Promise((success: CallableFunction, failure: CallableFunction) => {
            onProvider = () => { if (!provider) { failure() } else { success(provider) }};
        });
    return providerPromise;
}

export async function setProvider(prov: Provider)
{
    await getProvider();
    provider = prov;
}

getProvider();

var setupDefaultProvider = function ()
{
    provider = getProviderForNetwork('goerli-alpha');    
    onProvider!();
}

if (PROD)
    setupDefaultProvider();
else
{
    fetch('http://localhost:4999/status').then(() => {
        provider = new Provider();
        provider.baseUrl = "http://localhost:4999";
        provider.feederGatewayUrl = `${provider.baseUrl}/feeder_gateway`;
        provider.gatewayUrl = `${provider.baseUrl}/gateway`;
        provider = new Provider(provider);

        onProvider!();

        console.log("Switching to local provider");
    }).catch(() => {
        setupDefaultProvider();
    })
}
