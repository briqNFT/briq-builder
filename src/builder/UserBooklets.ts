import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { perUserStorable, perUserStore } from './PerUserStore';

class UserBookletsStore implements perUserStorable {
    booklets = [] as string[];

    async fetchData() {
        await walletInitComplete;
        try {
            this.booklets = (await backendManager.fetch(`v1/user/booklets/${getCurrentNetwork()}/${maybeStore.value!.userWalletAddress}`)).booklets
        } catch(ex) {
            console.error(ex);
        }
    }

    onEnter() {
        this.fetchData();
    }
}

export const userBookletsStore = perUserStore(UserBookletsStore);
userBookletsStore.setup();
