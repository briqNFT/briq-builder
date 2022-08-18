import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { perUserStorable, perUserStore } from './PerUserStore';


class UserSetStore implements perUserStorable {
    sets = [] as string[];

    async fetchData() {
        await walletInitComplete;
        try {
            this.sets = (await backendManager.fetch(`v1/user/sets/${getCurrentNetwork()}/${maybeStore.value!.userWalletAddress}`)).sets;
        } catch(ex) {
            console.error(ex);
        }
    }

    onEnter() {
        this.fetchData();
    }
}

export const userSetStore = perUserStore(UserSetStore);
userSetStore.setup();
