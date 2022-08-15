import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { perUserStorable, perUserStore } from './PerUserStore';


class UserBoxesStore implements perUserStorable {
    availableBoxes = [] as string[];

    async fetchData() {
        await walletInitComplete;
        try {
            this.availableBoxes = (await backendManager.fetch(`v1/user/boxes/${getCurrentNetwork()}/${maybeStore.value!.userWalletAddress}`)).box_token_ids
        } catch(ex) {
            console.error(ex);
        }
    }

    onEnter() {
        this.fetchData();
    }
}

export const userBoxesStore = perUserStore(UserBoxesStore);
userBoxesStore.setup();
