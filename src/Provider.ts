import { defaultProvider, Provider } from 'starknet';

import { fetchData } from './url';
import { store } from './store/Store'

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

var setupDefaultProvider = function ()
{
    provider = new Provider({});
    provider.baseUrl = "https://alpha4.starknet.io";
    provider.feederGatewayUrl = `${provider.baseUrl}/feeder_gateway`;
    provider.gatewayUrl = `${provider.baseUrl}/gateway`;
    provider = new Provider(provider);
    
    onProvider!();

    store.commit("wallet/set_signer", provider);
    
    // Get the contract address.
    provider.getContractAddresses().then((data) => { store.commit("wallet/set_starknet_contract_address", data.Starknet); });
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

        // Assume we want to use the local provider instead.
        store.commit("wallet/set_signer", provider);
        console.log("Switching to local provider");

    }).catch(() => {
        setupDefaultProvider();
    })
}
