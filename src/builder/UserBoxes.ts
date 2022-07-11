import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { perUserStorable, perUserStore } from './PerUserStore';

class UserBoxesStore implements perUserStorable {
    availableBoxes = [] as string[];

    async fetchData() {
        const contractStore = (await import('@/Dispatch')).contractStore;
        await walletInitComplete;
        this.availableBoxes = await contractStore.box!.getUnopenedBoxes(maybeStore.value!.userWalletAddress);
    }

    onEnter() {
        this.fetchData();
    }
}

export const userBoxesStore = perUserStore(UserBoxesStore);
userBoxesStore.setup();

