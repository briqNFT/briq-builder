import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';

class UserBoxesStore implements perUserStorable {
    user_id!: string;
    _availableBoxes = [] as string[];

    _lastDataFetch: any;
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [id: string]: {
        box_id: string,
        updates: {
            status: 'TENTATIVE' | 'TENTATIVE_DELETED',
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
            boxes: this._availableBoxes,
            metadata: meta,
        }
    }

    _deserialize(data: any) {
        this._availableBoxes = data.boxes;
        this.metadata = data.metadata;
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }


    async fetchData() {
        try {
            this._lastDataFetch = await backendManager.fetch(`v1/user/boxes/${this.user_id}`);
            await this._updateData(this._lastDataFetch);
        } catch(ex) {
            console.error(ex);
        }
    }

    async _updateData(data: any) {
        this._availableBoxes = data.box_token_ids.slice();
        let reprocess = false;
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const id in this.metadata)
            for (let i = 0; i < this.metadata[id].updates.length; ++i) {
                const update = this.metadata[id].updates[i];
                if (update.block && update.block <= data.last_block) {
                    this.metadata[id].updates.splice(i--, 1);
                    continue;
                }
                if (!update.block) {
                    const _block = maybeStore.value?.getProvider()?.getTransactionBlock(update.tx_hash);
                    const status = (await _block)?.status;
                    const block = (await _block)?.block_number;
                    if (status === 'REJECTED' || ((Date.now() - update.date) > 1000 * 60 * 60 && status === 'NOT_RECEIVED')) {
                        this.metadata[id].updates.splice(i--, 1);
                        continue;
                    }
                    if (block) {
                        update.block = block;
                        if (update.block)
                            reprocess = true;
                    }
                }
                if (update.status === 'TENTATIVE_DELETED') {
                    const idx = this._availableBoxes.indexOf(id);
                    if (idx !== -1)
                        this._availableBoxes.splice(idx, 1);
                } else
                    this._availableBoxes.push(id);
            }
        if (reprocess)
            this._updateData(data);
    }

    onEnter() {
        this.fetchData();
    }

    get availableBoxes() {
        return this._availableBoxes;
    }

    showOne(box_id: string, tx_hash: string, date?: number) {
        this._addOne('TENTATIVE', box_id, tx_hash, date);
    }

    hideOne(box_id: string, tx_hash: string, date?: number) {
        this._addOne('TENTATIVE_DELETED', box_id, tx_hash, date);

    }

    _addOne(status: 'TENTATIVE' | 'TENTATIVE_DELETED', box_id: string, tx_hash: string, date?: number) {
        if (!this.metadata[box_id])
            this.metadata[box_id] = {
                box_id: box_id,
                updates: [],
            }
        this.metadata[box_id].updates.push({
            status: status,
            tx_hash: tx_hash,
            block: undefined,
            date: date || Date.now(),
        })
        this._updateData(this._lastDataFetch);
    }
}

export const userBoxesStore = perUserStore(UserBoxesStore);
userBoxesStore.setup();
