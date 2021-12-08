import { reactive, watchEffect } from 'vue'

import { defaultProvider, Provider } from 'starknet';
import type { Signer } from 'starknet';

export const walletStore = {
    namespaced: true,
    state: () => ({
        // Always provide a signer, even if it's actually a provider.
        signer: defaultProvider as Provider | Signer,
        provider: defaultProvider,
        isConnected: false,
        goerliAddress: "",
        userWalletAddress: "",
    }),
    actions: {
        initialize: {
            root: true,
            handler: ({ state, dispatch, commit, getters }: any) => {
                if (window.localStorage.getItem("user_address"))
                    dispatch("set_user_wallet", window.localStorage.getItem("user_address")!);

                watchEffect(() => {
                    // TODO: switch to IDB
                    console.log("Writing address ", state.userWalletAddress);
                    window.localStorage.setItem("user_address", state.userWalletAddress);
                });

                var localProvider = new Provider({});
                localProvider.baseUrl = "http://localhost:4999";
                localProvider.feederGatewayUrl = `${localProvider.baseUrl}/feeder_gateway`;
                localProvider.gatewayUrl = `${localProvider.baseUrl}/gateway`;
                localProvider = new Provider(localProvider);

                // Attempt to connect to the local network
                localProvider.getContractAddresses().then((data) => {
                    // Assume we want to use the local provider instead.
                    commit("set_signer", localProvider);
                    commit("set_starknet_contract_address", data.Starknet);
                    console.log("Switching to local provider");
                }).catch(_ => {
                    let prov = new Provider({});
                    prov.baseUrl = "https://alpha4.starknet.io";
                    prov.feederGatewayUrl = `${prov.baseUrl}/feeder_gateway`;
                    prov.gatewayUrl = `${prov.baseUrl}/gateway`;
                    prov = new Provider(prov);
                    // Get the contract address on Goerli testnet.
                    prov.getContractAddresses().then((data) => { commit("set_starknet_contract_address", data.Starknet); });
                    commit("set_signer", prov);
                })
            }
        },
        async connect({ dispatch, commit }: any, data: any) {
            await dispatch("set_user_wallet", data.userWalletAddress);
            commit("connect", data);
        },
        async disconnect({ dispatch, commit }: any) {
            commit("disconnect");
        },
        set_user_wallet({ dispatch, commit }: any, data:any) {
            commit("set_user_wallet", data);
            dispatch("builderData/try_fetching_user_data", undefined, { root: true });
        }
    },
    mutations: {
        set_user_wallet(state: any, data: string)
        {
            state.userWalletAddress = data;
        },
        set_signer(state: any, data: Signer | Provider)
        {
            state.signer = data;
            state.provider = data;
        },
        set_starknet_contract_address(state: any, data: string)
        {
            state.goerliAddress = data;
        },
        connect(state: any, data: any)
        {
            state.userWalletAddress = data.userWalletAddress;
            state.signer = data.signer;
            state.provider = data.signer;
            state.isConnected = true;
        },
        disconnect(state: any)
        {
            state.userWalletAddress = "";
            state.signer = defaultProvider;
            state.provider = defaultProvider;
            state.isConnected = false;
        }
    }
};

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
