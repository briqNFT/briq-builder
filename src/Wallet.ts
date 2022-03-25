import { watchEffect, markRaw } from 'vue'

import { Provider } from 'starknet';
import type { Signer } from 'starknet';

import { logDebug, logDebugDelay } from './Messages'
import { noParallel, ticketing } from './Async';

import ManualWallet from './wallets/ManualWallet'
import ArgentXWallet, { getStarknetObject } from './wallets/ArgentX'
import MetamaskWallet from './wallets/Metamask'
import { IWallet } from './wallets/IWallet';

import { getProvider, setProvider } from './Provider';
import { watchSignerChanges } from '@/chain/Contracts';

import { legacySetsMgr } from './components/builder/set_browser/LegacySetsMgr';

import { setWalletInitComplete, walletInitComplete } from './WalletLoading';

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
                let storedAddress = window.localStorage.getItem("user_address");
                logDebugDelay(() => ["STARTING WALLET CONNECT", storedAddress]);

                await dispatch("try_enabling_wallet_silently", storedAddress);

                // If we failed, try again once we've loaded the object, just in case we arrived here too quickly.
                if (!state.signer)
                    getStarknetObject().then(() => {
                        if (!state.signer)
                            dispatch("try_enabling_wallet_silently", storedAddress);
                    }).catch(() => logDebug("Argent appears unavailable"));

                // Fallback to regular provider if that failed.
                if (!state.signer)
                {
                    logDebug("FALLING BACK");
                    let provider = await getProvider();
                    if (!state.signer)
                        commit("set_provider", provider);
                }

                // Mark the promise as complete - we've either succeeded at connecting or we don't have a default wallet/some other issue.
                setWalletInitComplete();

                watchSignerChanges(state);

                watchEffect(() => {
                    // TODO: switch to IDB
                    logDebug("Writing address ", state.userWalletAddress);
                    window.localStorage.setItem("user_address", state.userWalletAddress);
                });
            }
        },
        try_enabling_wallet_silently: ticketing(async function({ dispatch, commit }: any, data: string) {
            // For now the only available wallet is Argent.
            let argx = new ArgentXWallet();
            let address = data;
            // Explicit disconnect.
            if (address === "")
                return;
            if (argx.isLikelyAvailable() && (argx.canEnableSilently() || address))
                await dispatch("enable_wallet");
        }),
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
                    commit("set_provider", markRaw(provider));
                    commit("set_signer", { provider: markRaw(provider), signer: markRaw(signer), addr });
                    argx.watchForChanges(async () => {
                        // Disconnect first to reset addresses.
                        await dispatch("disconnect");
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
        async force_provider({ commit }: any, data: Provider)
        {
            commit("set_signer", { addr: "", signer: undefined });
            commit("set_provider", data);
        }
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
            legacySetsMgr.setup(state);
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
