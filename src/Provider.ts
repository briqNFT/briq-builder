import { Provider } from 'starknet';

import { PROD } from './Meta'

export var provider: undefined | Provider;

var providerPromise: undefined | Promise<Provider>;
var onProvider: undefined | CallableFunction;

export function getProviderForNetwork(network: string): Provider
{
    let ret = new Provider({});
    if (network === "mainnet")
        ret.baseUrl = "https://alpha-mainnet.starknet.io";
    else
        ret.baseUrl = "https://alpha4.starknet.io";
    ret.feederGatewayUrl = `${ret.baseUrl}/feeder_gateway`;
    ret.gatewayUrl = `${ret.baseUrl}/gateway`;
    return new Provider(ret);
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
