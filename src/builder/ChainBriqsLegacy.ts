import { Briq } from './Briq';
import { toRef } from 'vue';
import { logDebug, pushMessage } from '../Messages';

import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';
import { setChainBriqsStoreComplete } from './ChainBriqsAsync';
import { Notification } from '@/Notifications';
import { getPremigrationNetwork } from '@/chain/Network';
import { NotEnoughBriqs } from './ChainBriqs';

/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
export class LegacyChainBriqs implements perUserStorable {
    user_id!: string;
    balance = 0.0;
    status = 'NOT_LOADED' as 'NOT_LOADED' | 'OK' | 'ERROR';

    polling!: number;
    _lastDataFetch: any;

    metadata = [] as {
        status: 'TENTATIVE' | 'DELETING_SOON',
        tx_hash: string,
        quantity: number,
        shouldNotify: boolean, // If true, this assumes we're buying briqs.
        block: number | undefined,
        date: number,
    }[];

    _serialize() {
        return {
            balance: this.balance,
            metadata: this.metadata,
        }
    }

    _deserialize(data: any) {
        this.balance = data.balance;
        this.metadata = data.metadata;
    }

    reset() {
        this.status = 'NOT_LOADED';
        this.balance = 0.0;
    }

    onEnter(_old: string, _n: string) {
        this.loadFromChain();
        this.polling = setInterval(() => this.maybePoll(), 40000);

        //this._add('TENTATIVE', '0x1', 1234, '0xcafe', false);
    }

    onLeave(_: string, __: string | undefined): void {
        clearInterval(this.polling);
    }

    async maybePoll() {
        if (this.metadata.length)
            await this.loadFromChain();
    }

    async loadFromChain() {
        if (!this.user_id) {
            this.reset();
            return;
        }
        logDebug('LEGACY CHAIN BRIQS - LOADING FOR ', this.user_id);
        try {
            const [network, address] = this.user_id.split('/');
            const premigrationNetwork = getPremigrationNetwork(network);
            if (!premigrationNetwork)
                return;
            this._lastDataFetch = await backendManager.fetch(`v1/user/briqs/${premigrationNetwork}/${address}`);
            await this._parseChainData(this._lastDataFetch);
            this.status = 'OK';
            logDebug('LEGACY CHAIN BRIQS - LOADED ');
        } catch (err) {
            console.error(err.message);
            this.status = 'ERROR';
        }
    }

    async _parseChainData(chainData: { last_block: number } & { [material: string]: { ft_balance: number; nft_ids: string[] } }) {
        let bal = 0.0;
        for (const mat in chainData)
            if (mat === '0x1')
                bal = chainData[mat].ft_balance;

        let reprocess = false;
        const promises = new Map<any, Promise<any>>();
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (let i = 0; i < this.metadata.length; ++i) {
            const update = this.metadata[i];
            // Clear the metadata if we are now ahead of it.
            if (update.block && update.block <= chainData.last_block) {
                this.metadata.splice(i--, 1);
                continue;
            }
            // Try to fetch some updated data if we don't know the block, but don't block the optimistic processing.
            // update.tx_hash can be empty if we're in the 'buy while mint' multicall hack.
            if (!update.block && !promises.has(update) && update.tx_hash) {
                const _block = maybeStore.value?.getProvider()?.getTransactionBlock(update.tx_hash);
                if (_block)
                    promises.set(update, _block.then(data => {
                        const status = data.status;
                        const block = data.block_number;
                        if (status === 'REJECTED' || ((Date.now() - update.date) > 20 * 60 * 1000 && status === 'NOT_RECEIVED')) {
                            this.metadata.splice(i--, 1);
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
            if (update.status === 'DELETING_SOON')
                bal -= update.quantity;
            else
                bal += update.quantity;
        }
        this.balance = bal;
        for (const item of promises)
            await item[1];
        if (reprocess)
            this._parseChainData(chainData);
    }

    getNbBriqs() {
        return this.balance;
    }

    /**
     * Check that we have enough on-chain briqs available,
     * and if not return NFTs that can be used to complement.
     * Note that this function won't swap existing NFTs that are unavailable.
     * @param usageByMaterial entry balance
     * @returns a list of NFT briqs to replace.
     */
    findRealBriqs(usageByMaterial: { [material: string]: { ft_balance: number; nft_ids: string[] } }) {
        const swaps = [] as Briq[];
        for (const mat in usageByMaterial)
            if (usageByMaterial[mat].ft_balance > this.balance)
                throw new NotEnoughBriqs(mat);
        return swaps;
    }

    show(quantity: number, tx_hash: string, date?: number) {
        return this._add('TENTATIVE', quantity, tx_hash, false, date);
    }

    hide(quantity: number, tx_hash: string, date?: number) {
        return this._add('DELETING_SOON', quantity, tx_hash, false, date);
    }

    _add(status: 'TENTATIVE' | 'DELETING_SOON', quantity: number, tx_hash: string, shouldNotify: boolean, date?: number) {
        const newMeta = {
            quantity: quantity,
            status: status,
            tx_hash: tx_hash,
            shouldNotify: shouldNotify,
            block: undefined,
            date: date || Date.now(),
        };
        this.metadata.push(newMeta);
        this._parseChainData(this._lastDataFetch);
        return newMeta;
    }
}

export const legacyChainBriqs = perUserStore('LegacyChainBriqs', LegacyChainBriqs);
legacyChainBriqs.setup();
