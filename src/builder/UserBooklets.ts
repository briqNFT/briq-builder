import { perUserStorable, perUserStore } from './PerUserStore';

class UserBookletsStore implements perUserStorable {
    booklets = [] as string[];

    onEnter() {
        // TODO -> load booklets.
    }
}

export const userBookletsStore = perUserStore(UserBookletsStore);
userBookletsStore.setup();

