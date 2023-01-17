import { markRaw, shallowReactive, watchEffect } from 'vue';
import { backendManager } from '@/Backend';
import { Fetchable, makeAutoFetchable } from '@/DataFetching';

import { perUserStorable, perUserStore } from './PerUserStore';

import contractStore from '@/chain/Contracts';
import * as starknet from 'starknet';
import { reactive } from 'vue';
import { maybeStore } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';
import { Notification } from '@/Notifications';
import { defaultDict } from '@/ReactiveDefaultDict';
import { externalSetCache } from './ExternalSets';

// e.g. ducks_everywhere/10;
export type auctionId = string;


export class AuctionItemData {
    token_id!: string;
    minimum_bid!: string;
    growth_factor!: number;
    start_date!: number;
    duration!: number;
    _bids!: {
        bid: string, bidder: string, tx_hash: string, block: number, timestamp: number
    }[];
    highest_bid!: string;
    highest_bidder!: string;

    // Self-referential data
    auctionId: string;
    mainAuction: AuctionData;

    constructor(mainAuction: AuctionData, auctionId: auctionId, data: any) {
        this.mainAuction = mainAuction;
        this.auctionId = auctionId;
        // lazy but this works.
        for (const key in data)
            if (key !== 'bids')
                this[key] = data[key];
        this._bids = data.bids;
    }

    get bids() {
        // TODO: return longest list?
        if (this.mainAuction._bids[this.auctionId])
            return this.mainAuction._bids[this.auctionId];
        return this._bids;
    }
}

// Has to be global or sets need to know their auction and this loops back
export const setToAuctionMapping = reactive({} as Record<string, auctionId>);

class AuctionData {
    default = {
        token_id: '',
        minimum_bid: '10000',
        growth_factor: 10,
        start_date: Date.now() / 1000,
        duration: 3600,
        highest_bid: '0',
        highest_bidder: '',
        bids: [],
    };

    _data = new Fetchable<Record<auctionId, any>>();
    _items = {} as Record<auctionId, Fetchable<AuctionItemData>>;

    _bids = {} as Record<auctionId, Bid[]>;

    network: string;
    auction_theme: string;

    constructor(network: string, auction_theme: string) {
        this.network = network;
        this.auction_theme = auction_theme;
    }

    async fetchBids(auction: auctionId) {
        this._bids[auction] = await backendManager.fetch(`v1/${this.network}/${auction}/bids`);
    }

    async fetchData() {
        const fetchCall = backendManager.fetch(`v1/${this.network}/${this.auction_theme.split('/')[0]}/auction_data`);
        this._data.fetch(async () => (await fetchCall).data);
        await this._data._fetch;
        for (const auction_id in this._data._data)
            setToAuctionMapping[this._data._data![auction_id].token_id] = auction_id;
        return fetchCall;
    }

    auctionData(index: auctionId) {
        if (!this._items[index]) {
            this._items[index] = new Fetchable<AuctionItemData>();
            // Use a watchEffect to make sure that the item gets updated whenever the data is refeteched.
            // This makes it convenient to reuse the Fetchable.
            watchEffect(() => {
                this._items[index].fetch(async () => {
                    const tt = (await this._data._fetch);
                    return new AuctionItemData(this, index, tt![index]);
                });
            });
        }
        return this._items[index];
    }
}

const auctions = reactive({}) as Record<string, AuctionData>;

export const auctionDataStore = defaultDict((network: string) => {
    return defaultDict((path: auctionId) => {
        const theme = path.split('/')[0];
        if (!auctions[`${network}_${theme}`]) {
            auctions[`${network}_${theme}`] = new AuctionData(network, theme);
            setTimeout(() => auctions[`${network}_${theme}`].fetchData(), 0);
        }
        return auctions[`${network}_${theme}`];
    });
});

// Load the ducks everywhere auction data on startup.
auctionDataStore['starknet-testnet']['ducks_everywhere/10']

export interface Bid {
    status: 'CONFIRMED' | 'TENTATIVE' | 'PENDING' | 'REJECTED';
    tx_hash: string,
    block: number,
    date: number,
    bid_amount: string,
    bidder: string,
}

const USER_SYNC_DELAY = 30000;

/**
 * This class stores the user bids for a given auction.
 * Unlike the other perUserStorable, it doesn't really store the general data,
 * since that's provided by the API directly (and isn't really per-user anyways).
 * To show the highest bid, we just have to account for the user optimistic bid.
 */
class UserBidStore2 implements perUserStorable {
    user_id!: string;

    bids = {} as Record<auctionId, Bid>;
    metadata = {} as { [auction_id: auctionId]: {
        status: 'UNKNOWN' | 'TENTATIVE' | 'PENDING' | 'REJECTED' | 'CONFIRMED',
        tx_hash: string,
        block: number | undefined,
        date: number,
        bid_amount: string,
    }}

    polling!: number;

    async onEnter() {
        await this.syncBids();
        this.polling = setTimeout(() => this.syncBids(), 10000);
    }

    onLeave() {
        if (this.polling)
            clearTimeout(this.polling);
    }

    _serialize() {
        return {
            bids: this.bids,
            metadata: this.metadata,
        }
    }

    _deserialize(data: ReturnType<UserBidStore['_serialize']>) {
        this.bids = data.bids;
        this.metadata = data.metadata;
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }

    getBid(auctionId: auctionId) {
        return this.metadata[auctionId] || this.bids[auctionId];
    }

    async syncBids() {
        try {
            const network = this.user_id.split('/')[0];
            const theme = 'ducks_everywhere';
            const userBids = backendManager.fetch(`v1/user/bids/${network}/${theme}/${this.user_id.split('/')[1]}`);
            const data = await auctions[`${network}_${theme}`].fetchData();
            this._updateData(data);
            this.bids = await userBids;
        } catch(_) {
            if (APP_ENV === 'dev')
                console.error(_)
        }
        this.polling = setTimeout(() => this.syncBids(), 5000);
    }

    async _updateData(data: { lastBlock: number, data: any }) {
        const promises = new Map<any, Promise<any>>();
        for (const bidAuctionId in this.metadata) {
            // TODO: handle this as an error?
            if (!data.data[bidAuctionId])
                continue;
            const update = this.metadata[bidAuctionId];
            // Clear the metadata if we are now ahead of it.
            if (update.block && update.block <= data.lastBlock) {
                delete this.metadata[bidAuctionId];
                update.status = 'CONFIRMED';
                // Depending on the current highest bid, we'll want to show success or just skip straight to outbid.
                // (this is a relevant place because it makes sure we don't spam this warning too many times)
                if (update.bid_amount === data.data[bidAuctionId].highest_bid)
                    this.notifyBidSuccess(bidAuctionId, update);
                else
                    this.notifyBidOutbid(bidAuctionId, update);
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
                            delete this.metadata[bidAuctionId];
                            update.status = 'REJECTED';
                            this.notifyBidFailure(bidAuctionId, update);
                            return;
                        }
                        if (block) {
                            update.block = block;
                            update.status = 'PENDING';
                        }
                    }).catch(() => {}));
            }
        }
        for (const item of promises)
            await item[1];
    }

    async makeBid(value: starknet.number.BigNumberish, auction_id: string) {
        const contract = contractStore.auction_ducks!;
        const tx_response = await contract.approveAndBid(contractStore.eth_bridge_contract, auction_id.split('/')[1], value);
        const newBid = {
            status: 'TENTATIVE',
            tx_hash: tx_response!.transaction_hash,
            date: Date.now(),
            block: undefined,
            bid_amount: starknet.number.toFelt(value),
        } as Bid;
        // TODO: ignore current bid ?
        if (this.metadata[auction_id]) {}

        this.metadata[auction_id] = newBid;
        this.notifyBidPending(auction_id, newBid);
        return this.metadata[auction_id];
    }

    getSetName(auctionId: auctionId) {
        const network = this.user_id.split('/')[0];
        const token = auctions[`${network}_${auctionId.split('/')[0]}`].auctionData(auctionId)._data!.token_id;
        return externalSetCache[network][token]._data!.name || token;
    }

    /** Notifications stuff */

    notifyBidPending(auctionId: auctionId, item: Bid) {
        const network = this.user_id.split('/')[0];
        new Notification({
            type: 'bid_pending',
            title: 'Bid was sent',
            level: 'info',
            data: {
                tx_hash: item.tx_hash,
                auction_link: `/set/${network}/${auctions[`${network}_${auctionId.split('/')[0]}`].auctionData(auctionId)._data?.token_id}`,
                auction_name: this.getSetName(auctionId),
            },
            read: true,
        }).push(false);
    }

    notifyBidSuccess(auctionId: auctionId, item: Bid) {
        const network = this.user_id.split('/')[0];
        new Notification({
            type: 'bid_confirmed',
            title: 'Successful bid',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                auction_link: `/set/${network}/${auctions[`${network}_${auctionId.split('/')[0]}`].auctionData(auctionId)._data?.token_id}`,
                auction_name: this.getSetName(auctionId),
            },
            read: false,
        }).push(true);
    }

    notifyBidOutbid(auctionId: auctionId, item: Bid) {
        const network = this.user_id.split('/')[0];
        new Notification({
            type: 'bid_outbid',
            title: 'Your have been outbid',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                auction_link: `/set/${network}/${auctions[`${network}_${auctionId.split('/')[0]}`].auctionData(auctionId)._data?.token_id}`,
                auction_name: this.getSetName(auctionId),
            },
            read: false,
        }).push(true);
    }

    notifyBidFailure(auctionId: auctionId, item: Bid) {
        const network = this.user_id.split('/')[0];
        new Notification({
            type: 'bid_failure',
            title: 'Bidding transaction failed',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                auction_link: `/set/${network}/${auctions[`${network}_${auctionId.split('/')[0]}`].auctionData(auctionId)._data?.token_id}`,
                auction_name: this.getSetName(auctionId),
            },
            read: false,
        }).push(true);
    }
}

export const userBidsStore2 = perUserStore('UserBidStore2', UserBidStore2);
userBidsStore2.setup();
