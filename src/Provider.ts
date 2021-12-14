import { defaultProvider, Provider } from 'starknet';

import { fetchData } from './url';
import { store } from './store/Store'

export var provider: undefined | Provider;

import { PROD } from './Meta'

var setupDefaultProvider = function ()
{
    provider = new Provider({});
    provider.baseUrl = "https://alpha4.starknet.io";
    provider.feederGatewayUrl = `${provider.baseUrl}/feeder_gateway`;
    provider.gatewayUrl = `${provider.baseUrl}/gateway`;
    provider = new Provider(provider);
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
        // Assume we want to use the local provider instead.
        store.commit("wallet/set_signer", provider);
        console.log("Switching to local provider");

    }).catch(() => {
        setupDefaultProvider();
    })
}
