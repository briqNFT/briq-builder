import { backendManager } from '@/Backend';
import { logDebug } from '@/Messages';
import { Notification, notificationsManager } from '@/Notifications';
import { useGenesisStore } from './GenesisStore';
import { perUserStorable, perUserStore } from './PerUserStore';

import contractStore from '@/chain/Contracts';
import { BigNumberish, toFelt } from 'starknet/utils/number';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { reactive } from 'vue';
import { blockchainProvider } from '@/chain/BlockchainProvider';

export interface Bid {
    bid_id: string,
    tx_hash: string,
    block: number,
    status: 'CONFIRMED' | 'TENTATIVE' | 'PENDING' | 'REJECTED';
    box_id: string,
    bid_amount: string,
}

const USER_SYNC_DELAY = 5000;

class UserBidStore implements perUserStorable {
    lastConfirmedBlock = -1;
    bids = [] as Bid[];

    meta = {} as { [bid_id: string]: {
        status: 'UNKNOWN' | 'TENTATIVE' | 'PENDING' | 'REJECTED' | 'CONFIRMED',
    }}

    _init() {
        setTimeout(() => this.poll(), USER_SYNC_DELAY);
    }

    _serialize() {
        return {
            lastConfirmedBlock: this.lastConfirmedBlock,
            bids: this.bids,
            meta: this.meta,
        }
    }

    _deserialize(data: ReturnType<UserBidStore['_serialize']>) {
        this.lastConfirmedBlock = data.lastConfirmedBlock;
        this.bids = data.bids;
        this.meta = data.meta;
    }

    matchBid(to_match: Bid, bids: { [key: string]: Bid }) {
        if (bids[to_match.bid_id])
            return bids[to_match.bid_id];
        // This assumes that the tentative bids come from the frontend, which is likely fair.
        for (const bid_id in bids)
            if (bids[bid_id].box_id === to_match.box_id && bids[bid_id].tx_hash == to_match.tx_hash)
                return bids[bid_id]
        return undefined;
    }

    async onEnter() {
        await this.syncBids();
    }

    async syncBids() {
        logDebug('USER BID STORE - SYNCING')
        const bidDatas = await backendManager.fetch(`v1/bids/user/${getCurrentNetwork()}/${maybeStore.value?.userWalletAddress}`)

        const bidData = {
            block: 0,
            bids: {},
        };
        for (const bid of bidDatas) {
            bidData.block = Math.max(bid.block, bidData.block);
            bidData.bids[bid.bid_id] = bid;
        }

        for (let i = 0; i < this.bids.length; ++i) {
            const bid = this.bids[i];
            const newBidData = this.matchBid(bid, bidData.bids);
            if (newBidData) {
                if (bid.status !== 'CONFIRMED') {
                    bid.status = 'CONFIRMED';
                    this.notifyConfirmed(bid);
                }
                newBidData._found = true;
            }
        }
        for (const bid_id in bidData.bids)
            if (!bidData.bids[bid_id]._found) {
                bidData.bids[bid_id].status = 'CONFIRMED';
                this.bids.push(bidData.bids[bid_id]);
                this.notifyConfirmed(bidData.bids[bid_id])
            }

        this.lastConfirmedBlock = bidData.block;
    }

    async makeBid(value: BigNumberish, box_id: string) {
        const genesisStore = useGenesisStore();
        const itemData = genesisStore.metadata[box_id]._data!;
        const tx_response = await contractStore.auction?.approveAndBid(contractStore.eth_bridge_contract, itemData.token_id, itemData.auction_id, value)
        const newBid = {
            bid_id: tx_response!.transaction_hash,
            tx_hash: tx_response!.transaction_hash,
            bid_amount: toFelt(value),
            box_id: box_id,
            status: 'TENTATIVE',
            block: -1,
        } as Bid;
        this.registerTentativeBid(newBid);
        this.bids.push(newBid);
        return this.bids[this.bids.length - 1];
    }

    async poll() {
        await this.syncBids();

        const dropList = [];
        for (const bid of this.bids) {
            if (bid.status !== 'TENTATIVE')
                continue;
            const status = await blockchainProvider.value?.getTransactionStatus(bid.tx_hash);
            if (status === 'PENDING' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') {
                bid.status = 'PENDING';
                this.notifyPending(bid);
            } else if (status === 'REJECTED') {
                bid.status = 'REJECTED';
                this.notifyRejected(bid);
                dropList.push(bid.bid_id);
            }
        }
        for (const drop of dropList)
            this.bids.splice(this.bids.findIndex(x => x.bid_id === drop), 1);
        setTimeout(() => this.poll(), USER_SYNC_DELAY);
    }

    /** Notifications stuff */

    registerTentativeBid(bid: Bid) {
        if (this.meta[bid.bid_id])
            return;
        this.meta[bid.bid_id] = { status: 'TENTATIVE' };

        new Notification({
            type: 'tentative_bid',
            title: 'Bid sent',
            level: 'info',
            data: {
                tx_hash: bid.tx_hash,
                box_id: bid.box_id,
                amount: bid.bid_amount,
            },
            read: true,
        }).push(true);
    }

    notifyRejected(bid: Bid) {
        const wasRejected = this.meta[bid.bid_id]?.status !== 'REJECTED';
        this.meta[bid.bid_id] = { status: 'REJECTED' };
        new Notification({
            type: 'rejected_bid',
            title: 'Rejected bid',
            level: 'error',
            data: {
                tx_hash: bid.tx_hash,
                box_id: bid.box_id,
                amount: bid.bid_amount,
            },
            read: wasRejected,
        }).push(true);
    }

    notifyPending(bid: Bid) {
        const wasTentative = this.meta[bid.bid_id]?.status !== 'TENTATIVE';
        this.meta[bid.bid_id] = { status: 'PENDING' };
        new Notification({
            type: 'pending_bid',
            title: 'Pending bid',
            level: 'success',
            data: {
                tx_hash: bid.tx_hash,
                box_id: bid.box_id,
                amount: bid.bid_amount,
            },
            read: wasTentative,
        }).push(true);
    }

    notifyConfirmed(bid: Bid) {
        const wasConfirmed = this.meta[bid.bid_id]?.status !== 'CONFIRMED' && this.meta[bid.bid_id]?.status !== 'PENDING';
        this.meta[bid.bid_id] = { status: 'CONFIRMED' };
        new Notification({
            type: 'confirmed_bid',
            title: 'Bid confirmed',
            level: 'success',
            data: {
                tx_hash: bid.tx_hash,
                box_id: bid.box_id,
                amount: bid.bid_amount,
            },
            read: wasConfirmed,
        }).push(true);
    }
}

export const userBidsStore = perUserStore(UserBidStore);

export interface ProductBid {
    bidder: string,
    bid_amount: string,
    bid_id: string,
    tx_hash: string,
    block: number,
    timestamp: string,
}

class ProductBidsStore {
    _bids = {} as { [box_id: string]: { bids: { [bid_id: string]: ProductBid }, highest_bid: undefined | string, lastConfirmedBlock: number, lastRefresh: number } }

    status = 'PENDING' as 'PENDING' | 'OK' | 'ERROR';

    setup(box_id: string) {
        if (!(box_id in this._bids))
            this._bids[box_id] = {
                bids: {},
                highest_bid: undefined,
                lastConfirmedBlock: 0,
                lastRefresh: 0,
            }
    }

    async fetch(box_id: string) {
        this.setup(box_id);
        if (Date.now() - this._bids[box_id].lastRefresh < 2000)
            return;
        if (this.status === 'ERROR')
            this.status = 'PENDING';
        try {
            const bidDatas = await backendManager.fetch(`v1/bids/box/${getCurrentNetwork()}/${box_id}`) as ProductBid[];
            for (const bid of bidDatas) {
                this._bids[box_id].bids[bid.bid_id] = bid;
                this._bids[box_id].lastConfirmedBlock = Math.max(bid.block, this._bids[box_id].lastConfirmedBlock);
                this._bids[box_id].highest_bid = bid.bid_id;
            }
            this.status = 'OK';
        } catch(err) {
            console.error(err);
            this.status = 'ERROR';
        }
        this._bids[box_id].lastRefresh = Date.now();
    }

    bids(box_id: string) {
        this.setup(box_id);
        this.fetch(box_id);
        return this._bids[box_id];
    }
}

export const productBidsStore = reactive(new ProductBidsStore());