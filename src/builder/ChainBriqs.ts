import { Briq } from './Briq';
import { toRef } from 'vue';
import { logDebug, pushMessage } from '../Messages';
import { reportError } from '../Monitoring';

import { backendManager } from '@/Backend';
import { perUserStorable, perUserStore } from './PerUserStore';
import { maybeStore } from '@/chain/WalletLoading';

// TODO: there can technically be more than whatever is supported by number
type BALANCE = { ft_balance: number; nft_ids: string[] };

class NotEnoughBriqs extends Error {
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

    _lastDataFetch: any;
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as {
        [material: string]: {
            status: 'TENTATIVE' | 'TENTATIVE_DELETED',
            tx_hash: string,
            quantity: number,
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

    onEnter(_old: string, n: string) {
        this.loadFromChain();
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
            console.error(err);
            this.status = 'ERROR';
        }
        this.fetchingBriqs = false;
    }

    async _parseChainData(chainData: { last_block: number } & { [material: string]: { ft_balance: number; nft_ids: string[] } }) {
        this.byMaterial = {};
        for (const mat in chainData)
            if (mat !== 'last_block')
                this.byMaterial[mat] = { ft_balance: chainData[mat].ft_balance, nft_ids: chainData[mat].nft_ids.slice() };

        let reprocess = false;
        // Process metadata and clean it up where it seems like things went through (this is a bit optimistic but that's probably OK)
        for (const material in this.metadata)
            for (let i = 0; i < this.metadata[material].length; ++i) {
                const update = this.metadata[material][i];
                if (update.block && update.block <= chainData.last_block) {
                    this.metadata[material].splice(i--, 1);
                    continue;
                }
                if (!update.block) {
                    const _block = maybeStore.value?.getProvider()?.getTransactionBlock(update.tx_hash);
                    const status = (await _block)?.status;
                    const block = (await _block)?.block_number;
                    if (status === 'REJECTED' || ((Date.now() - update.date) > 1000 * 60 * 60 && status === 'NOT_RECEIVED')) {
                        this.metadata[material].splice(i--, 1);
                        continue;
                    }
                    if (block) {
                        update.block = block;
                        if (update.block)
                            reprocess = true;
                    }
                }
                if (update.status === 'TENTATIVE_DELETED') {
                    if (this.byMaterial[material])
                        this.byMaterial[material].ft_balance = Math.max(0, this.byMaterial[material].ft_balance - update.quantity);
                } else {
                    if (!this.byMaterial[material])
                        this.byMaterial[material] = { ft_balance: 0, nft_ids: [] };
                    this.byMaterial[material].ft_balance += update.quantity;
                }
            }
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

    show(material: string, quantity: number, tx_hash: string, date?: number) {
        this._add('TENTATIVE', material, quantity, tx_hash, date);
    }

    hide(material: string, quantity: number, tx_hash: string, date?: number) {
        this._add('TENTATIVE_DELETED', material, quantity, tx_hash, date);
    }

    _add(status: 'TENTATIVE' | 'TENTATIVE_DELETED', material: string, quantity: number, tx_hash: string, date?: number) {
        if (!this.metadata[material])
            this.metadata[material] = [];
        this.metadata[material].push({
            quantity: quantity,
            status: status,
            tx_hash: tx_hash,
            block: undefined,
            date: date || Date.now(),
        })
        this._parseChainData(this._lastDataFetch);
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
}

const _chainBriqs = perUserStore('ChainBriqs', ChainBriqs);
_chainBriqs.setup();
export const chainBriqs = toRef(_chainBriqs, 'current');
