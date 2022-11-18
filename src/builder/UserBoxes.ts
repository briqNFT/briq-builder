import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';
import { Notification } from '@/Notifications';

class UserBoxesStore implements perUserStorable {
    user_id!: string;
    _availableBoxes = [] as string[];

    _lastDataFetch: any;
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [id: string]: {
        box_id: string,
        updates: {
            // TENTATIVE_PENDING is a special state to indicate that something is pending,
            // which we use to lock/unlock the unbox button.
            status: 'TENTATIVE' | 'TENTATIVE_PENDING' | 'DELETING_SOON',
            tx_hash: string,
            block: number | undefined,
            date: number,
        }[],
    }};

    polling!: number;

    _serialize() {
        const meta = {};
        for (const id in this.metadata)
            if (this.metadata[id].updates.length)
                meta[id] = this.metadata[id];
        return {
            boxes: this._availableBoxes || [],
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
            this._lastDataFetch = await backendManager.fetch(`v1/user/data/${this.user_id}`);
            await this._updateData(this._lastDataFetch);
        } catch(ex) {
            console.error(ex);
        }
    }

    async _updateData(data: any) {
        const boxes = data.box_token_ids.slice();
        let reprocess = false;
        const promises = new Map<any, Promise<any>>();
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const id in this.metadata)
            for (let i = 0; i < this.metadata[id].updates.length; ++i) {
                const update = this.metadata[id].updates[i];
                // Clear the metadata if we are now ahead of it.
                if (update.block && update.block <= data.last_block) {
                    this.metadata[id].updates.splice(i--, 1);
                    if (update.status.indexOf('TENTATIVE') !== -1)
                        this.notifyPurchaseConfirmed({ tx_hash: update.tx_hash, box_id: id });
                    else
                        this.notifyUnboxConfirmed({ tx_hash: update.tx_hash, box_id: id });
                    continue;
                }
                // Try to fetch some updated data if we don't know the block, but don't block the optimistic processing.
                if (!update.block && !promises.has(update)) {
                    const _block = maybeStore.value?.getProvider()?.getTransactionBlock(update.tx_hash);
                    if (_block)
                        promises.set(update, _block.then(txData => {
                            const status = txData.status;
                            const block = txData.block_number;
                            if (status === 'REJECTED' || ((Date.now() - update.date) > 1000 * 60 * 60 && status === 'NOT_RECEIVED')) {
                                this.metadata[id].updates.splice(i--, 1);
                                reprocess = true;
                                if (update.status.indexOf('TENTATIVE') !== -1)
                                    this.notifyPurchaseFailure({ tx_hash: update.tx_hash, box_id: id });
                                else
                                    this.notifyUnboxFailure({ tx_hash: update.tx_hash, box_id: id });
                                return;
                            }
                            if (update.status === 'TENTATIVE' && (status === 'PENDING' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1')) {
                                update.status = 'TENTATIVE_PENDING';
                                // Don't notify if we'll immediately mark it as confirmed.
                                if (block > data.last_block)
                                    this.notifyPurchasePending({ tx_hash: update.tx_hash, box_id: id });
                            }
                            if (block) {
                                update.block = block;
                                if (update.block)
                                    reprocess = true;
                            }
                        }).catch(() => {}));
                }
                if (update.status === 'DELETING_SOON') {
                    const idx = boxes.indexOf(id);
                    if (idx !== -1)
                        boxes.splice(idx, 1);
                } else
                    boxes.push(id);
            }
        // Update locally, then wait for pending stuff and see if we need to reprocess.
        this._availableBoxes = boxes;
        for (const item of promises)
            await item[1];
        if (reprocess)
            this._updateData(data);
    }

    onEnter() {
        /*
        this.metadata['starknet_city_ongoing/spaceman'] = {
            box_id: 'starknet_city_ongoing/spaceman',
            updates: [{
                tx_hash: '0xcafe',
                block: undefined,
                status: 'DELETING_SOON',
                date: Date.now() - 1000*60*60*10,
            },
            ],
        }/*
        setTimeout(() => {
            this.metadata['starknet_city_ongoing/spaceman'].updates[0].status = 'TENTATIVE_PENDING'
        }, 6000);
        */
        this.fetchData();
        this.polling = setInterval(() => this.fetchData(), 10000);
    }

    onLeave() {
        if (this.polling)
            clearTimeout(this.polling);
    }

    get availableBoxes() {
        return this._availableBoxes;
    }

    showOne(box_id: string, tx_hash: string, date?: number) {
        this._addOne('TENTATIVE', box_id, tx_hash, date);
    }

    hideOne(box_id: string, tx_hash: string, date?: number) {
        this._addOne('DELETING_SOON', box_id, tx_hash, date);

    }

    _addOne(status: 'TENTATIVE' | 'DELETING_SOON', box_id: string, tx_hash: string, date?: number) {
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

    notifyPurchasePending(item: { tx_hash: string, box_id: string }) {
        new Notification({
            type: 'box_purchase_pending',
            title: 'Unbox available',
            level: 'info',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: false,
        }).push(true);
    }

    notifyPurchaseConfirmed(item: { tx_hash: string, box_id: string }) {
        new Notification({
            type: 'box_purchase_confirmed',
            title: 'Box successfully purchased',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: false,
        }).push(true);
    }

    notifyPurchaseFailure(item: { tx_hash: string, box_id: string }) {
        new Notification({
            type: 'box_purchase_failure',
            title: 'Error with box purchase',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: false,
        }).push(true);
    }

    // This one is pre-read -> we're assuming we're good.
    notifyUnboxConfirmed(item: { tx_hash: string, box_id: string }) {
        new Notification({
            type: 'box_unbox_confirmed',
            title: 'Unboxing successful',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: true,
        }).push(false);
    }

    notifyUnboxFailure(item: { tx_hash: string, box_id: string }) {
        new Notification({
            type: 'box_unbox_failure',
            title: 'Error during unboxing',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: false,
        }).push(true);
    }

}

export const userBoxesStore = perUserStore('UserBoxesStore', UserBoxesStore);
userBoxesStore.setup();
