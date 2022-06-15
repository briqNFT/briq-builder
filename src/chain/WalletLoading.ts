import type { WalletStore } from './Wallet';

export let maybeStore = undefined as undefined | WalletStore;
export let setWalletInitComplete: any;

// Await this to wait until the wallet init process is complete.
export const walletInitComplete = new Promise<WalletStore>((resolve, _) => {
    setWalletInitComplete = (store: WalletStore) => {
        resolve(store);
        maybeStore = store;
    }
});