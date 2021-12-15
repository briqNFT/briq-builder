import { reactive, watchEffect } from 'vue'

import { defaultProvider, Provider } from 'starknet';
import type { Signer } from 'starknet';

import ManualWallet from './wallets/ManualWallet'
import ArgentXWallet from './wallets/ArgentX'
import MetamaskWallet from './wallets/Metamask'
import { IWallet } from './wallets/IWallet';

import { getProvider } from './Provider';

export const walletStore = {
    namespaced: true,
    state: () => ({
        // Always provide a signer, even if it's actually a provider.
        signer: undefined as undefined | Signer,
        provider: undefined as undefined | Provider,
        goerliAddress: "",
        userWalletAddress: "",
    }),
    actions: {
        initialize: {
            root: true,
            handler: async ({ state, dispatch, commit, getters }: any) => {

                let provider = await getProvider();
                commit("set_provider", provider);

                if (window.localStorage.getItem("user_address"))
                    // If we have a user address stored, try immediately enabling the wallet.
                    await dispatch("enable_wallet");

                watchEffect(() => {
                    // TODO: switch to IDB
                    console.log("Writing address ", state.userWalletAddress);
                    window.localStorage.setItem("user_address", state.userWalletAddress);
                });
            }
        },
        async enable_wallet({ commit }: any) {
            // For now the only available wallet is Argent.
            let argx = new ArgentXWallet();
            if (argx.isLikelyAvailable())
            {
                try
                {
                    let [addr, provider, signer] = await argx.enable();
                    // Update the provider (may be mainnet or testnet).
                    commit("set_provider", provider);
                    commit("set_signer", { addr, signer });
                    return true;
                }
                catch(err)
                {
                    console.warn(err);
                }
            }
            return false;
        },
        async disconnect({ commit }: any)
        {
            commit("set_signer", { addr: "", signer: undefined });
        }
    },
    mutations: {
        set_provider(state: any, data: Provider)
        {
            state.provider = data;
        },
        set_user_wallet(state: any, data: string)
        {
            state.userWalletAddress = data;
        },
        set_signer(state: any, data: { signer: Signer, addr: string })
        {
            state.signer = data.signer;
            state.userWalletAddress = data.addr;
        },

        set_starknet_contract_address(state: any, data: string)
        {
            state.goerliAddress = data;
        },
    }
};

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
