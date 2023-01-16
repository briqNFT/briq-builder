import { computed, isReactive, markRaw, reactive, shallowReactive } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { autoFetchable, makeAutoFetchable } from '@/DataFetching';

// Returns existing object or creates a new one and returns it.
const defaultDict = <T>(t: (prop: string) => T, ...args: any[]) => {
    return new Proxy(shallowReactive({} as Record<string, T>), {
        get: (target, prop: string, receiver): T => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);
            target[prop] = t(prop, ...args);
            return target[prop];
        },
        set: (target, prop, value) => {
            return Reflect.set(target, prop, value);
        },
    });
}

// Creates a simple object indexing on network ID & object key.
// The `query` data fetcher receives those as arguments and returns the data,
// which is assumed to be POD (and thus marked raw).
const perNetworkStaticData = (query: (network: string, prop: string) => Promise<any>) => {
    return defaultDict((network: string) => makeAutoFetchable(async (prop: string) => {
        return markRaw(await query(network, prop));
    }));
}


export type auctionId = string;


export interface AuctionItemData {
    minimum_bid: string,
    growth_factor: number,
    start_date: number,
    duration: number,
    bids: {
        bid: string, bidder: string, tx_hash: string, block: number, timestamp: number
    }[],
    highest_bid: string,
    highest_bidder: string
}

export const setToAuctionMapping = reactive({});

let generalQuery;
export const auctionDataStore = perNetworkStaticData(async (network: string, path: auctionId) => {
    if (!generalQuery)
        generalQuery = (async () => {
            const ret = await backendManager.fetch(`v1/${network}/${path.split('/')[0]}/auction_data`);
            for (const auction_id in ret.data)
                setToAuctionMapping[ret.data[auction_id].token_id] = auction_id;
            return ret;
        })();
    return ((await generalQuery)?.data?.[path] ?? {
        token_id: '0xcafe',
        minimum_bid: '10000',
        growth_factor: 10,
        start_date: Date.now() / 1000,
        duration: 3600,
        highest_bid: '0',
        highest_bidder: '',
        bids: [],
    }) as AuctionItemData;
});

// Load the ducks everywhere auction data on startup.
auctionDataStore['starknet-testnet']['ducks_everywhere/10']

import { backendManager } from '@/Backend';
import { logDebug } from '@/Messages';
import { Notification } from '@/Notifications';
import { useGenesisStore } from './GenesisStore';
import { perUserStorable, perUserStore } from './PerUserStore';

import contractStore from '@/chain/Contracts';
import * as starknet from 'starknet';
import { getCurrentNetwork } from '@/chain/Network';
import { reactive } from 'vue';
import { maybeStore } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';

export interface Bid {
    status: 'CONFIRMED' | 'TENTATIVE' | 'PENDING' | 'REJECTED';
    tx_hash: string,
    block: number,
    date: number,
    bid_amount: string,
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
        this.polling = setTimeout(() => this.syncBids(), 5000);
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

    async syncBids() {
        try {
            // TODO centralize
            const network = this.user_id.split('/')[0];
            const auction = 'ducks_everywhere';
            const userBids = backendManager.fetch(`v1/user/bids/${network}/${auction}/${this.user_id.split('/')[1]}`);
            const data = await backendManager.fetch(`v1/${network}/${auction}/auction_data`);
            this._updateData(data);
            this.bids = await userBids;
            this.polling = setTimeout(() => this.syncBids(), 5000);
        } catch(_) {
            if (APP_ENV === 'dev')
                console.error(_)
        }
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
                // TODO: inform the user that their bid has been outbid and/or successfully accepted.
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
                            // TODO: inform the user of the failure of their bid.
                            return;
                        }
                        if (block)
                            update.block = block;
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
            block: -1,
            bid_amount: starknet.number.toFelt(value),
        } as Bid;
        // TODO: ignore current bid ?
        if (this.metadata[auction_id]) {}

        this.metadata[auction_id] = newBid;
        // TODO: push notification
        return this.metadata[auction_id];
    }

    /** Notifications stuff */

}

export const userBidsStore2 = perUserStore('UserBidStore2', UserBidStore2);
userBidsStore2.setup();
