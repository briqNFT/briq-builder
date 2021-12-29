import { Provider } from 'starknet';

import { PROD } from './Meta'

export var provider: undefined | Provider;

var providerPromise: undefined | Promise<Provider>;
var onProvider: undefined | CallableFunction;

export function getProvider(): Promise<Provider>
{
    if (!providerPromise)
        providerPromise = new Promise((success: CallableFunction, failure: CallableFunction) => {
            onProvider = () => { if (!provider) { failure() } else { success(provider) }};
        });
    return providerPromise;
}
getProvider();

export async function setProvider(prov: Provider)
{
    await getProvider();
    provider = prov;
}

var setupDefaultProvider = function ()
{
    provider = new Provider({});
    provider.baseUrl = "https://alpha4.starknet.io";
    provider.feederGatewayUrl = `${provider.baseUrl}/feeder_gateway`;
    provider.gatewayUrl = `${provider.baseUrl}/gateway`;
    provider = new Provider(provider);
    
    onProvider!();
}

if (PROD)
    setupDefaultProvider();
else
{
    fetch('http://localhost:4999/status').then(() => {
        provider = new Provider({});
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
