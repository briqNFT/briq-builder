import { store } from "../store/Store";

import { setupMintProxy } from '@/chain/MintProxy'

import contractStore from '@/chain/Contracts';

import { watchEffect } from 'vue';
export function setupSync()
{
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
            if (store.state.wallet.baseUrl.search("localhost") !== -1)
                store.dispatch("wallet/set_starknet_contract_address", "0xCAFEFADE");
            else
                store.dispatch("wallet/set_starknet_contract_address", undefined);
        }
    });
}
