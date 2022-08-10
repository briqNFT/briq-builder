import { backendManager } from '@/Backend';
import { logDebug } from '@/Messages';
import { Notif, notificationsManager } from '@/Notifications';
import { useGenesisStore } from './GenesisStore';
import { BidNotif } from './BidNotif';
import { hexUuid } from '@/Uuid';
import { perUserStorable, perUserStore } from './PerUserStore';

import contractStore from '@/chain/Contracts';
import { BigNumberish, toFelt } from 'starknet/utils/number';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { reactive } from 'vue';

class FailedBidNotif extends Notif {
    type = 'failed_bid';
    item: string;
    value: number;

    constructor(data: any) {
        super(data);
        this.item = data.item;
        this.value = data.value;
    }

    get summary() {
        const genesisStore = useGenesisStore();
        return `Your bid on ${ genesisStore.metadata[this.item]._data?.name || this.item } of ${ this.value } ETH has failed to process`;
    }

    serialize() {
        return {
            item: this.item,
            value: this.value,
        }
    }
}

notificationsManager.register('failed_bid', FailedBidNotif);

interface Bid {
    tx_hash: string,
    block: number,
    status: 'CONFIRMED' | 'TENTATIVE' | 'PENDING';
    item: string,
    bid_amount: string,
}

class UserBidStore implements perUserStorable {
    lastConfirmedBlock = -1;
    bids = [] as Bid[];

    async onEnter() {
        logDebug('SYNCING USER BID BLOCK')
        const bidDatas = await backendManager.fetch(`v1/bids/user/${getCurrentNetwork()}/${maybeStore.value?.userWalletAddress}`)

        const bidData = {
            block: 0,
            bids: {},
        };
        for (const bid of bidDatas) {
            bidData.block = Math.max(bid.block, bidData.block);
            bidData.bids[bid.tx_hash] = bid;
        }
        console.log(bidDatas, bidData);

        for (let i = 0; i < this.bids.length; ++i) {
            const bid = this.bids[i];
            // Can't find the bid and should have been confirmed -> mark it failed.
            const newBidData = bidData.bids[bid.tx_hash];
            if (!newBidData) {
                if (bid.block <= bidData.block) {
                    notificationsManager.push(new FailedBidNotif(bid));
                    this.bids.splice(i, 1);
                    i--;
                }
            } else if (bid.status !== 'CONFIRMED')
                bid.status = 'CONFIRMED';
            newBidData._found = true;
        }
        for (const txHash in bidData.bids)
            if (!bidData.bids[txHash]._found)
                this.bids.push(bidData.bids[txHash]);

        this.lastConfirmedBlock = bidData.block;
    }

    async makeBid(value: BigNumberish, item: string) {
        const genesisStore = useGenesisStore();
        const itemData = genesisStore.metadata[item]._data!;
        const tx_response = await contractStore.auction?.approveAndBid(contractStore.eth_bridge_contract, itemData.token_id, itemData.auction_id, value)
        const newBid = {
            tx_hash: tx_response!.transaction_hash,
            bid_amount: toFelt(value),
            item: item,
            status: 'TENTATIVE',
            block: -1,
        } as Bid;
        // The notification will handle its own polling logic.
        new BidNotif(newBid).push();
        this.bids.push(newBid);
        return newBid;
    }
}

export const userBidsStore = perUserStore(UserBidStore);

class ProductBidsStore {
    _bids = {} as { [box_id: string]: { bids: { [bid_id: string]: Bid }, lastConfirmedBlock: number, lastRefresh: number } }

    status = 'PENDING' as 'PENDING' | 'OK' | 'ERROR';

    setup(box_id: string) {
        if (!(box_id in this._bids))
            this._bids[box_id] = {
                bids: {},
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
            const bidDatas = await backendManager.fetch(`v1/bids/box/${getCurrentNetwork()}/${box_id}`)
            // TODO: use something else for ID
            for (const bid of bidDatas) {
                this._bids[box_id].bids[bid.tx_hash] = bid;
                this._bids[box_id].lastConfirmedBlock = Math.max(bid.block, this._bids[box_id].lastConfirmedBlock);
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