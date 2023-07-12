import type { WalletStore } from './Wallet';
import { ref } from 'vue';
import { APP_ENV } from '@/Meta';

export const maybeStore = ref(undefined as undefined | WalletStore);
export let setWalletInitComplete: any;

export const WEB_WALLET_URL = {
    'prod': 'https://web.argent.xyz',
    'test': 'https://web.hydrogen.argent47.net',
    'dev': 'https://web.hydrogen.argent47.net',
}[APP_ENV];

// Load the dispatch, containing the wallet store right away.
// The assumption is that any file actually loading this module will want this code.
import('@/Dispatch');

// Await this to wait until the wallet init process is complete.
export const walletInitComplete = new Promise<WalletStore>((resolve, _) => {
    setWalletInitComplete = (store: WalletStore) => {
        resolve(store);
        maybeStore.value = store;
    }
});
