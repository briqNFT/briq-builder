import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';
import { setsManager } from './SetsManager';

class UserBookletsStore implements perUserStorable {
    user_id!: string;
    _booklets = [] as string[];
    _lastDataFetch: any;

    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [id: string]: {
        booklet_id: string,
        updates: {
            status: 'TENTATIVE' | 'DELETING_SOON',
            tx_hash: string,
            block: number | undefined,
            date: number,
        }[],
    }};

    _serialize() {
        const meta = {};
        for (const id in this.metadata)
            if (this.metadata[id].updates.length)
                meta[id] = this.metadata[id];
        return {
            booklets: this._booklets,
            metadata: meta,
        }
    }

    _deserialize(data: any) {
        this._booklets = data.booklets;
        this.metadata = data.metadata;
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }

    async fetchData() {
        try {
            this._lastDataFetch = await backendManager.fetch(`v1/user/data/${this.user_id}`);
            await this._updateData(this._lastDataFetch);
            // There's no excellent place to do this, so I'm doing this here: drop WIP booklets that we no longer own.
            for (const setId in setsManager.setsInfo) {
                const booklet_id = setsManager.setsInfo[setId].booklet;
                if (booklet_id && this.booklets.indexOf(booklet_id) === -1)
                    setsManager.deleteLocalSet(setId);
            }
        } catch(ex) {
            console.error(ex);
        }
    }

    async _updateData(data: any) {
        const booklets = data.booklets.slice();
        let reprocess = false;
        const promises = new Map<any, Promise<any>>();
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const bookletId in this.metadata)
            for (let i = 0; i < this.metadata[bookletId].updates.length; ++i) {
                const update = this.metadata[bookletId].updates[i];
                // Clear the metadata if we are now ahead of it.
                if (update.block && update.block <= data.last_block) {
                    this.metadata[bookletId].updates.splice(i--, 1);
                    continue;
                }
                // Try to fetch some updated data if we don't know the block, but don't block the optimistic processing.
                if (!update.block && !promises.has(update)) {
                    const _block = maybeStore.value?.getProvider()?.getTransactionBlock(update.tx_hash);
                    if (_block)
                        promises.set(update, _block.then(data => {
                            const status = data.status;
                            const block = data.block_number;
                            if (status === 'REJECTED' || ((Date.now() - update.date) > 1000 * 60 * 60 && status === 'NOT_RECEIVED')) {
                                this.metadata[bookletId].updates.splice(i--, 1);
                                reprocess = true;
                                return;
                            }
                            if (block) {
                                update.block = block;
                                if (update.block)
                                    reprocess = true;
                            }
                        }).catch(() => {}));
                }
                if (update.status === 'DELETING_SOON') {
                    const idx = this._booklets.indexOf(bookletId);
                    if (idx !== -1)
                        this._booklets.splice(idx, 1);
                } else
                    this._booklets.push(bookletId);
            }
        // Update locally, then wait for pending stuff and see if we need to reprocess.
        this._booklets = booklets;
        for (const item of promises)
            await item[1];
        if (reprocess)
            this._updateData(data);
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
        this.fetchData();
    }

    get booklets() {
        return this._booklets;
    }

    showOne(booklet_id: string, tx_hash: string, date?: number) {
        this._addOne('TENTATIVE', booklet_id, tx_hash, date);
    }

    hideOne(booklet_id: string, tx_hash: string, date?: number) {
        this._addOne('DELETING_SOON', booklet_id, tx_hash, date);

    }

    _addOne(status: 'TENTATIVE' | 'DELETING_SOON', booklet_id: string, tx_hash: string, date?: number) {
        if (!this.metadata[booklet_id])
            this.metadata[booklet_id] = {
                booklet_id: booklet_id,
                updates: [],
            }
        this.metadata[booklet_id].updates.push({
            status: status,
            tx_hash: tx_hash,
            block: undefined,
            date: date || Date.now(),
        })
        this._updateData(this._lastDataFetch);
    }
}

export const userBookletsStore = perUserStore('UserBookletsStore', UserBookletsStore);
userBookletsStore.setup();
