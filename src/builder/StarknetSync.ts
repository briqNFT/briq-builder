import { store } from "../store/Store";

import { fetchData } from '../url'

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
        briq: "0x0273f8db9cb370e945c125293b3742deedc4a034b8fc770762ac89b0747452cb",
        mint: "",
        set: "",
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
        if (!store.state.builderData.briqContract || !store.state.wallet.userWalletAddress)
            return;
        // console.log("FETCHING DATA", store.state.wallet.provider)
        await store.dispatch("builderData/try_fetching_user_data");
    })
}
