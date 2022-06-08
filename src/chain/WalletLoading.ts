import type { WalletStore } from './Wallet';

export let setWalletInitComplete: any;
// Await this to wait until the wallet init process is complete.
export const walletInitComplete = new Promise<WalletStore>((resolve, _) => {
    setWalletInitComplete = resolve;
});
