import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';

class UserBookletsStore implements perUserStorable {
    user_id!: string;
    booklets = [] as string[];

    async fetchData() {
        try {
            this.booklets = (await backendManager.fetch(`v1/user/booklets/${this.user_id}`)).booklets
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
