import { Briq } from './Briq';
import { toRef } from 'vue';
import { logDebug, pushMessage } from '../Messages';

import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';
import { setChainBriqsStoreComplete } from './ChainBriqsAsync';
import { Notification } from '@/Notifications';
import { legacyChainBriqs } from './ChainBriqsLegacy';

// TODO: there can technically be more than whatever is supported by number
type BALANCE = { ft_balance: number; nft_ids: string[] };

export class NotEnoughBriqs extends Error {
    material: string;
    constructor(material: string) {
        super(`Not enough Briqs with material ${material}`);
        this.material = material;
    }
}

class NFTNotAvailable extends Error {
    token_id: string;
    constructor(token_id: string) {
        super(`The NFT ${token_id} is not available, the set cannot be minted.`);
        this.token_id = token_id;
    }
}

/**
 * Responsible for maintaining the state of 'on-chain' briqs, as opposed to local set-briqs.
 */
export class ChainBriqs implements perUserStorable {
    user_id!: string;
    fetchingBriqs = false;
    byMaterial: { [material: string]: BALANCE } = {};
    status = 'NOT_LOADED' as 'NOT_LOADED' | 'OK' | 'ERROR';

    polling!: number;

    _lastDataFetch: any;
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as {
        [material: string]: {
            status: 'TENTATIVE' | 'DELETING_SOON',
            tx_hash: string,
            quantity: number,
            shouldNotify: boolean, // If true, this assumes we're buying briqs.
            block: number | undefined,
            date: number,
        }[],
    };

    _serialize() {
        const meta = {};
        for (const id in this.metadata)
            if (this.metadata[id].length)
                meta[id] = this.metadata[id];
        return {
            byMaterial: this.byMaterial,
            metadata: meta,
        }
    }

    _deserialize(data: any) {
        this.byMaterial = data.byMaterial;
        this.metadata = data.metadata;
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }

    reset() {
        this.status = 'NOT_LOADED';
        this.byMaterial = {};
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
        if (Object.keys(this.metadata).length)
            await this.loadFromChain();
    }

    async loadFromChain() {
        this.fetchingBriqs = true;
        if (!this.user_id) {
            this.reset();
            return;
        }
        logDebug('CHAIN BRIQS - LOADING FOR ', this.user_id);
        try {
            this._lastDataFetch = await backendManager.fetch(`v1/user/briqs/${this.user_id}`);
            await this._parseChainData(this._lastDataFetch);
            this.status = 'OK';
            logDebug('CHAIN BRIQS - LOADED ');
        } catch (err) {
            console.error(err.message);
            this.status = 'ERROR';
        }
        this.fetchingBriqs = false;
    }

    async _parseChainData(chainData: { last_block: number } & { [material: string]: { ft_balance: number; nft_ids: string[] } }) {
        const byMaterial = {} as typeof this.byMaterial;
        for (const mat in chainData)
            if (mat !== 'last_block')
                byMaterial[mat] = { ft_balance: chainData[mat].ft_balance, nft_ids: chainData[mat].nft_ids.slice() };

        let reprocess = false;
        const promises = new Map<any, Promise<any>>();
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const material in this.metadata)
            for (let i = 0; i < this.metadata[material].length; ++i) {
                const update = this.metadata[material][i];
                // Clear the metadata if we are now ahead of it.
                if (update.block && update.block <= chainData.last_block) {
                    if (update.status === 'TENTATIVE' && update.shouldNotify)
                        this.notifyPurchaseConfirmed(update);
                    this.metadata[material].splice(i--, 1);
                    if (this.metadata[material].length === 0) {
                        delete this.metadata[material];
                        break;
                    }
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
                                if (update.status === 'TENTATIVE' && update.shouldNotify)
                                    this.notifyMintingRejected(update);
                                this.metadata[material].splice(i--, 1);
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
                    if (byMaterial[material])
                        byMaterial[material].ft_balance = byMaterial[material].ft_balance - update.quantity;
                } else {
                    if (!byMaterial[material])
                        byMaterial[material] = { ft_balance: 0, nft_ids: [] };
                    byMaterial[material].ft_balance += update.quantity;
                }
            }
        this.byMaterial = byMaterial;
        for (const item of promises)
            await item[1];
        if (reprocess)
            this._parseChainData(chainData);
    }

    _getNbBriqs(material: string) {
        return (this.byMaterial?.[material]?.ft_balance ?? 0) + (this.byMaterial?.[material]?.nft_ids?.length ?? 0);
    }

    getNbBriqs() {
        let ret = 0;
        for (const material in this.byMaterial)
            ret += this._getNbBriqs(material);
        return ret;
    }

    show(material: string, quantity: number, tx_hash: string, shouldNotify?: boolean, date?: number) {
        const newMeta = this._add('TENTATIVE', material, quantity, tx_hash, shouldNotify || false, date);
        if (shouldNotify)
            this.notifyPurchasePending(newMeta);
        return newMeta;
    }

    hide(material: string, quantity: number, tx_hash: string, date?: number) {
        return this._add('DELETING_SOON', material, quantity, tx_hash, false, date);
    }

    _add(status: 'TENTATIVE' | 'DELETING_SOON', material: string, quantity: number, tx_hash: string, shouldNotify: boolean, date?: number) {
        if (!this.metadata[material])
            this.metadata[material] = [];
        const newMeta = {
            quantity: quantity,
            status: status,
            tx_hash: tx_hash,
            shouldNotify: shouldNotify,
            block: undefined,
            date: date || Date.now(),
        };
        this.metadata[material].push(newMeta);
        this._parseChainData(this._lastDataFetch);
        return newMeta;
    }

    removeMetadataItem(item: ChainBriqs['metadata']['any'][0]) {
        const idx = this.metadata['0x1'].findIndex(x => x === item)
        if (idx !== undefined && idx !== -1) {
            this.metadata['0x1'].splice(idx, 1);
            this._parseChainData(this._lastDataFetch);
        }
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
        for (const mat in usageByMaterial) {
            if (!this.byMaterial[mat])
                throw new NotEnoughBriqs(mat);
            const chainBalance = Object.assign({}, this.byMaterial[mat]);
            // Check that the NFTs we want to lay down are available.
            for (const nft of usageByMaterial[mat].nft_ids)
                if (chainBalance.nft_ids.indexOf(nft) === -1)
                    throw new NFTNotAvailable(nft);
            chainBalance.ft_balance -= usageByMaterial[mat].ft_balance;
            // At this point if we have enough fungible we're good.
            if (chainBalance.ft_balance >= 0)
                continue;
                // Otherwise we'll use leftover NFTs.
            const need = -chainBalance.ft_balance;
            if (need > chainBalance.nft_ids.length)
                throw new NotEnoughBriqs(mat);
            for (let i = 0; i < need; ++i)
                swaps.push(new Briq(mat).setNFTid(chainBalance.nft_ids.pop()!));
        }
        return swaps;
    }

    notifyPurchasePending(data: ChainBriqs['metadata']['any'][0]) {
        new Notification({
            type: 'briq_purchase_pending',
            title: 'Buying briqs',
            level: 'info',
            data: {
                tx_hash: data.tx_hash,
                amount: data.quantity,
                network: this.user_id.split('/')[0],
            },
            read: true,
        }).push(false);
    }

    notifyPurchaseConfirmed(data: ChainBriqs['metadata']['any'][0]) {
        new Notification({
            type: 'briq_purchase_confirmed',
            title: 'briqs bought',
            level: 'success',
            data: {
                tx_hash: data.tx_hash,
                amount: data.quantity,
                network: this.user_id.split('/')[0],
            },
            read: true,
        }).push(false);
    }

    notifyMintingRejected(data: ChainBriqs['metadata']['any'][0]) {
        new Notification({
            type: 'briq_purchase_rejected',
            title: 'briqs purchase failed',
            level: 'error',
            data: {
                tx_hash: data.tx_hash,
                amount: data.quantity,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }
}

const _chainBriqs = perUserStore('ChainBriqs', ChainBriqs);
_chainBriqs.setup();

export const chainBriqs = toRef(_chainBriqs, 'current');
setChainBriqsStoreComplete(_chainBriqs, legacyChainBriqs);
