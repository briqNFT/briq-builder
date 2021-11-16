import { reactive } from 'vue'

import { defaultProvider } from 'starknet';
import type { Signer, Provider } from 'starknet';

export var contractStore = reactive({
    signer: null as null | Signer,
    provider: defaultProvider,
    isConnected: false,
    goerliAddress: "",
    userWalletAddress: "",
});

// Get the contract address on Goerli testnet.
defaultProvider.getContractAddresses().then((data) => { contractStore.goerliAddress = data.Starknet; });

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
