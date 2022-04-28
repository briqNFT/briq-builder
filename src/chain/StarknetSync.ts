import { setupMintProxy } from '@/chain/MintProxy';

import contractStore from '@/chain/Contracts';
import { walletStore2 } from './Wallet';

import { watchEffect } from 'vue';
export function setupSync() {
    watchEffect(() => {
        if (contractStore.mint && walletStore2.userWalletAddress)
            setupMintProxy(contractStore.mint, walletStore2.userWalletAddress);
    });
}
