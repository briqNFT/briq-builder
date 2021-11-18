import { reactive, watchEffect } from 'vue'

import { defaultProvider, Provider } from 'starknet';
import type { Signer } from 'starknet';

export var contractStore = reactive({
    signer: null as null | Signer,
    provider: defaultProvider,
    isConnected: false,
    goerliAddress: "",
    userWalletAddress: "",
});


if (window.localStorage.getItem("user_address"))
    contractStore.userWalletAddress = window.localStorage.getItem("user_address")!;

watchEffect(() => {
    // TODO: switch to IDB
    window.localStorage.setItem("user_address", contractStore.userWalletAddress);
});


var localProvider = new Provider({});
localProvider.baseUrl = "http://localhost:4999";
localProvider.feederGatewayUrl = `${localProvider.baseUrl}/feeder_gateway`;
localProvider.gatewayUrl = `${localProvider.baseUrl}/gateway`;
localProvider = new Provider(localProvider);

// Attempt to connect to the local network
localProvider.getContractAddresses().then((data) => {
    // Assume we want to use the local provider instead.
    contractStore.provider = localProvider;
    contractStore.goerliAddress = data.Starknet;
    console.log("Switching to local provider");
}).catch(_ => {
    let prov = new Provider({});
    prov.baseUrl = "https://alpha4.starknet.io";
    prov.feederGatewayUrl = `${prov.baseUrl}/feeder_gateway`;
    prov.gatewayUrl = `${prov.baseUrl}/gateway`;
    prov = new Provider(prov);
    console.log(prov);
    // Get the contract address on Goerli testnet.
    prov.getContractAddresses().then((data) => { contractStore.goerliAddress = data.Starknet; });
    contractStore.provider = prov;
})

import ManualWallet from './wallets/ManualWallet'
import ArgentXWallet from './wallets/ArgentX'
import MetamaskWallet from './wallets/Metamask'
import { IWallet } from './wallets/IWallet';

export function getPotentialWallets(): { [key: string]: { name: string, handler: new () => IWallet }}
{
    return {
        "manual": {
            "name": "Manual",
            "handler": ManualWallet
        },
        "argentx": {
            "name": "Argent-X",
            "handler": ArgentXWallet
        },
        "metamask": {
            "name": "Metamask",
            "handler": MetamaskWallet
        }
    }
}

export function getSigner()
{
    return contractStore.signer;
}
