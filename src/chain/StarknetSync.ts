import { setupMintProxy } from '@/chain/MintProxy';

import contractStore from '@/chain/Contracts';
import { walletStore } from './Wallet';

import { watchEffect } from 'vue';
export function setupSync() {
    watchEffect(() => {
        if (contractStore.mint && walletStore.userWalletAddress)
            setupMintProxy(contractStore.mint, walletStore.userWalletAddress);
    });
}
