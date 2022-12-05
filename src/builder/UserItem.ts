import { backendManager } from '@/Backend';
import { maybeStore } from '@/chain/WalletLoading';
import { perUserStorable } from './PerUserStore';

export abstract class GeneralizedUserItem implements perUserStorable {
    user_id!: string;
    _lastDataFetch: any;

    _tokenNames = [] as string[];

    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [id: string]: {
        token_name: string,
        updates: {
            // TENTATIVE_PENDING is a special state to indicate that something is pending.
            status: 'TENTATIVE' | 'TENTATIVE_PENDING' | 'DELETING_SOON',
            tx_hash: string,
            block: number | undefined,
            date: number,
        }[],
    }};

    abstract _serialize(): Record<string, any>;

    abstract _deserialize(data: ReturnType<this['_serialize']>): void;

    _onStorageChange(data: any) {
        this._deserialize(data);
    }

    onEnter() {
        this._fetchData();
    }

    onLeave() {}

    abstract fetchData(): Promise<any>;

    async _fetchData() {
        try {
            this._lastDataFetch = await this.fetchData();
            this._updateData(this._lastDataFetch);
        } catch(ex) {
            console.error(ex);
        }
    }

    async _updateData(data: any) {
        // Generalize the _updataData functionss in UserBooklets and UserBoxes
        const tokens = data.slice();
        let reprocess = false;
        const promises = new Map<any, Promise<any>>();
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const tokenName in this.metadata)
            for (let i = 0; i < this.metadata[tokenName].updates.length; ++i) {
                const update = this.metadata[tokenName].updates[i];
                // Clear the metadata if we are now ahead of it.
                if (update.block && update.block <= data.last_block) {
                    this.metadata[tokenName].updates.splice(i--, 1);
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
                                this.metadata[tokenName].updates.splice(i--, 1);
                                reprocess = true;
                                return;
                            }
                            if (update.status === 'TENTATIVE' && (status === 'PENDING' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1'))
                                update.status = 'TENTATIVE_PENDING';
                            if (block) {
                                update.block = block;
                                if (update.block)
                                    reprocess = true;
                            }
                        }).catch(() => {}));
                }
                if (update.status === 'DELETING_SOON') {
                    const idx = tokens.indexOf(tokenName);
                    if (idx !== -1)
                        tokens.splice(idx, 1);
                } else
                    tokens.push(tokenName);
            }
        // Update locally, then wait for pending stuff and see if we need to reprocess.
        this._tokenNames = tokens;
        for (const item of promises)
            await item[1];
        if (reprocess)
            this._updateData(data);
    }

    _showOne(tokenName: string, txHash: string, date?: number) {
        this._addOne('TENTATIVE', tokenName, txHash, date);
    }

    _hideOne(tokenName: string, txHash: string, date?: number) {
        this._addOne('DELETING_SOON', tokenName, txHash, date);
    }

    _addOne(status: 'TENTATIVE' | 'DELETING_SOON', tokenName: string, txHash: string, date?: number) {
        if (!this.metadata[tokenName])
            this.metadata[tokenName] = {
                token_name: tokenName,
                updates: [],
            };
        this.metadata[tokenName].updates.push({
            status: status,
            tx_hash: txHash,
            block: undefined,
            date: date || Date.now(),
        });
        this._updateData(this._lastDataFetch);
    }
}
