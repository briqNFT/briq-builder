import { backendManager } from '@/Backend';
import { blockchainProvider } from '@/chain/BlockchainProvider';
import { perUserStorable, perUserStore } from './PerUserStore';

class UserBookletsStore implements perUserStorable {
    user_id!: string;
    _booklets = [] as string[];
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [id: string]: {
        booklet_id: string,
        updates: {
            status: 'TENTATIVE' | 'TENTATIVE_DELETED',
            tx_hash: string,
            block: number | undefined,
        }[],
    }};

    async fetchData() {
        try {
            const data = await backendManager.fetch(`v1/user/booklets/${this.user_id}`);
            this._booklets = data.booklets;

            // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
            for (const bookletId in this.metadata)
                for (let i = 0; i < this.metadata[bookletId].updates.length; ++i) {
                    const update = this.metadata[bookletId].updates[i];
                    if (update.block && update.block < data.last_block) {
                        this.metadata[bookletId].updates.splice(i--, 1);
                        continue;
                    }
                    /*console.log('totoro ', update);
                    if (!update.block)
                        blockchainProvider.value?.getTransactionReceipt(update.tx_hash).then(x => {
                            console.log('totoro', x);
                        })
                    */
                    if (update.status === 'TENTATIVE_DELETED') {
                        const idx = this._booklets.indexOf(bookletId);
                        if (idx !== -1)
                            this._booklets.splice(idx, 1);
                    } else
                        this._booklets.push(bookletId);
                }
        } catch(ex) {
            console.error(ex);
        }
    }

    onEnter() {
        /*
        this.metadata['starknet_city_ongoing/spaceman'] = {
            booklet_id: 'starknet_city_ongoing/spaceman',
            updates: [{
                tx_hash: '0x4d5e4f9653732622b9decf43d91e4181c4a8356bb3692af1ddd4646b43c4541',
                block: undefined,
                status: 'TENTATIVE',
            },
            ],
        }
        */
        this.fetchData();
    }

    get booklets() {
        return this._booklets;
    }
}

export const userBookletsStore = perUserStore(UserBookletsStore);
userBookletsStore.setup();
