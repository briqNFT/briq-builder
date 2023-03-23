import { backendManager } from '@/Backend';
import { perUserStore } from './PerUserStore';
import { setsManager } from './SetsManager';
import { GeneralizedUserItem } from './UserItem';
class UserBookletsStore extends GeneralizedUserItem {
    polling!: number;

    _serialize(){
        const meta = {};
        for (const id in this.metadata)
            if (this.metadata[id].updates.length)
                meta[id] = this.metadata[id];
        return {
            booklets: this._tokenNames,
            metadata: meta,
        }
    }

    _deserialize(data: any) {
        this._tokenNames = data.booklets;
        this.metadata = data.metadata;
    }

    async fetchData() {
        const data = (await backendManager.fetch(`v1/user/data/${this.user_id}`));
        return {
            lastBlock: data.last_block,
            data: data.booklets,
        }
    }

    async _fetchData() {
        try {
            this._lastDataFetch = await this.fetchData();
            this._updateData(this._lastDataFetch);
            // There's no excellent place to do this, so I'm doing this here: drop WIP booklets that we no longer own.
            for (const setId in setsManager.setsInfo) {
                const booklet_id = setsManager.setsInfo[setId].booklet;
                if (booklet_id && this.booklets.indexOf(booklet_id) === -1)
                    setsManager.deleteLocalSet(setId);
            }
        } catch(ex) {
            console.error(ex);
            this.polling = setTimeout(() => this._fetchData(), 60000);
            return;
        }
        this.polling = setTimeout(() => this._fetchData(), 10000);
    }

    get booklets() {
        return this._tokenNames || [];
    }

    onEnter() {
        /*
        this.metadata['starknet_city_ongoing/spaceman'] = {
            booklet_id: 'starknet_city_ongoing/spaceman',
            updates: [{
                tx_hash: '0xcafe',
                block: undefined,
                status: 'TENTATIVE',
                date: Date.now(),
            },
            ],
        }
        */
        super.onEnter();
        this.polling = setTimeout(() => this._fetchData(), 10000);
    }

    onLeave() {
        if (this.polling)
            clearTimeout(this.polling);
    }
}

export const userBookletsStore = perUserStore('UserBookletsStore', UserBookletsStore);
userBookletsStore.setup();
