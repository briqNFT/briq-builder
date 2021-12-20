import { store } from "../store/Store";

import { setupMintProxy } from './MintProxy'

import contractStore from "../Contracts";

import { watchEffect } from 'vue';
export function setupSync()
{
    watchEffect(async () => {
        if (!contractStore.briq || !contractStore.set || !contractStore.mint)
            return;
        // console.log("FETCHING DATA")
        await store.dispatch("builderData/try_fetching_user_data");
    })

    watchEffect(() => {
        if (contractStore.mint && store.state.wallet.userWalletAddress)
            setupMintProxy(contractStore.mint, store.state.wallet.userWalletAddress);
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
