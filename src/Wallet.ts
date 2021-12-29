import { reactive, watchEffect } from 'vue'

import { defaultProvider, Provider } from 'starknet';
import type { Signer } from 'starknet';

import { logDebug, logDebugDelay } from './Messages'
import { noParallel } from './Async';

import ManualWallet from './wallets/ManualWallet'
import ArgentXWallet from './wallets/ArgentX'
import MetamaskWallet from './wallets/Metamask'
import { IWallet } from './wallets/IWallet';

import { getProvider, setProvider } from './Provider';
import { watchSignerChanges } from './Contracts'

export const walletStore = {
    namespaced: true,
    state: () => ({
        // Always provide a signer, even if it's actually a provider.
        signer: undefined as undefined | Signer,
        provider: undefined as undefined | Provider,
        baseUrl: "",
        starknetAddress: "",
        userWalletAddress: "",
    }),
    actions: {
        initialize: {
            root: true,
            handler: async ({ state, dispatch, commit, getters }: any) => {
                
                logDebugDelay(() => ["STARTING WALLET CONNECT", window.localStorage.getItem("user_address")]);

                if (window.localStorage.getItem("user_address"))
                    // If we have a user address stored, try immediately enabling the wallet.
                    await dispatch("enable_wallet");

                // Fallback to regular provider if that failed.
                if (!state.signer)
                {
                    logDebug("FALLING BACK");
                    let provider = await getProvider();
                    if (!state.signer)
                        commit("set_provider", provider);
                }

                watchSignerChanges(state);

                watchEffect(() => {
                    // TODO: switch to IDB
                    console.log("Writing address ", state.userWalletAddress);
                    window.localStorage.setItem("user_address", state.userWalletAddress);
                });
            }
        },
        enable_wallet: noParallel(async ({ dispatch, commit }: any) => {
            // For now the only available wallet is Argent.
            let argx = new ArgentXWallet();
            logDebug("ARGENT-X AVAILABILITY:", argx.isLikelyAvailable());
            if (argx.isLikelyAvailable())
            {
                try
                {
                    let [addr, provider, signer] = await argx.enable();
                    logDebug("ARGENT-X ENABLED:", addr, provider, signer);
                    // Update the provider (may be mainnet or testnet).
                    commit("set_provider", provider);
                    commit("set_signer", { provider, signer, addr });
                    argx.watchForChanges(async () => {
                        await dispatch("enable_wallet");
                    })
                    return true;
                }
                catch(err)
                {
                    console.warn(err);
                }
            }
            return false;
        }),
        async disconnect({ commit }: any)
        {
            commit("set_signer", { addr: "", signer: undefined });
        },
        set_starknet_contract_address({ commit }: any, data: any)
        {
            commit("set_starknet_contract_address", data);
        },

    },
    mutations: {
        set_provider(state: any, data: Provider)
        {
            state.provider = data;
            state.baseUrl = state.provider.baseUrl;
            setProvider(data);
        },
        set_signer(state: any, data: { provider: Provider, signer: Signer, addr: string })
        {
            state.signer = data.signer;
            state.userWalletAddress = data.addr;
        },

        set_starknet_contract_address(state: any, data: string)
        {
            state.starknetAddress = data;
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
