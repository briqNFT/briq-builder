import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';


class UserBoxesStore implements perUserStorable {
    user_id!: string;
    availableBoxes = [] as string[];

    async fetchData() {
        try {
            this.availableBoxes = (await backendManager.fetch(`v1/user/boxes/${this.user_id}`)).box_token_ids
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
