import { store } from "../store/Store";

import { setupMintProxy } from './MintProxy'

import BriqContract from '../contracts/briq'
import SetContract from '../contracts/set'
import MintContract from '../contracts/mint'

const ADDRESSES = {
    // Alpha4-goerli
    "https://alpha4.starknet.io": {
        briq: "0x01d6b126e22d2f805a64fa0ce53ddebcd37363d13ab89960bd2bf896dd2742d4",
        mint: "0x03dbda16e85ad0d72cd54ffd2971b4e18e71a4f9d1d310cc8fd2deb564fc8a59",
        set: "0x01618ffcb9f43bfd894eb4a176ce265323372bb4d833a77e20363180efca3a65",
    },
    "https://alpha-mainnet.starknet.io": {
        briq: "0x03c5c2e0c3e6f48c5fa286876418450304ae5da85d333bcbf35ca495d10939c5",
        mint: "0x05be37356fffd6bc49940dff73bfb92d2f355f2c3e9cddef36274b844c59dfc6",
        set: "0x03527d1810201e32d34bd2221713a9094b965c7af0be61e622714f27a937e547",
    }
}

import { toRef, watchEffect } from 'vue';
export function setupSync()
{
    watchEffect(async () => {
        let addr = store.state.wallet.baseUrl && ADDRESSES[store.state.wallet.baseUrl];
        // console.log("UPDATING ADDRESSES", store.state.wallet.baseUrl, addr);
        if (addr)
        {
            await store.commit("builderData/set_briq_contract", new BriqContract(addr.briq, toRef(store.state.wallet, "signer")));
            await store.commit("builderData/set_set_contract", new SetContract(addr.set, toRef(store.state.wallet, "signer")));
            await store.commit("builderData/set_mint_contract", new MintContract(addr.mint, toRef(store.state.wallet, "signer")));
        }
        else
        {
            await store.commit("builderData/set_briq_contract", undefined);
            await store.commit("builderData/set_set_contract", undefined);
            await store.commit("builderData/set_mint_contract", undefined);
        }
    })

    watchEffect(async () => {
        if (!store.state.builderData.briqContract || !store.state.builderData.setContract || !store.state.wallet.userWalletAddress)
            return;
        // console.log("FETCHING DATA", store.state.wallet.provider)
        await store.dispatch("builderData/try_fetching_user_data");
    })

    watchEffect(() => {
        if (store.state.builderData.mintContract && store.state.wallet.userWalletAddress)
            setupMintProxy(store.state.builderData.mintContract, store.state.wallet.userWalletAddress);
    });

    watchEffect(async () => {
        try {
            let addr = (await store.state.wallet.provider.getContractAddresses())?.Starknet;
            store.dispatch("wallet/set_starknet_contract_address", addr);
        } catch(err)
        {
            store.dispatch("wallet/set_starknet_contract_address", undefined);
        }
    });
}
