import { backendManager } from '@/Backend';
import { Notification } from '@/Notifications';
import { useGenesisStore } from './GenesisStore';
import { perUserStorable, perUserStore } from './PerUserStore';


export interface Purchase {
    box_id: string,
    tx_hash: string,
    status: 'TENTATIVE' | 'REJECTED' | 'CONFIRMED';
}

/**
 * This class exists to easily keep track of ongoing purchases.
 */
class UserPurchases implements perUserStorable {
    user_id!: string;
    purchases = {} as { [tx_hash: string]: Purchase }

    _init() {
        setTimeout(() => this.poll(), 5000)
    }

    _serialize() {
        const ret = {};
        for (const hash in this.purchases)
            if (this.purchases[hash].status === 'TENTATIVE')
                ret[hash] = this.purchases[hash];

        return ret;
    }

    _deserialize(data: any) {
        this.purchases = data;
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }

    async makePurchase(box_id: string, price: string) {
        const genesisStore = useGenesisStore();
        const itemData = await genesisStore.metadata[box_id]._fetch;
        const contractStore = (await import('@/Dispatch')).contractStore;
        const tx_response = await contractStore.auction?.approveAndBid(contractStore.eth_bridge_contract, itemData.token_id, itemData.auction_id, price)
        this.purchases[tx_response!.transaction_hash] = {
            tx_hash: tx_response!.transaction_hash,
            box_id: box_id,
            status: 'TENTATIVE',
        }
        return this.purchases[tx_response!.transaction_hash];
    }


    async poll() {
        for (const hash in this.purchases) {
            const item = this.purchases[hash];
            if (item.status !== 'TENTATIVE')
                continue;
            const [network, wallet_id] = this.user_id.split('/');
            const transferData = await backendManager.fetch(`v1/box/get_transfer/${network}/${item.box_id}/${item.tx_hash}`)
            if (transferData && transferData.to === wallet_id) {
                item.status = 'CONFIRMED';
                this.notifyConfirmed(item);
            }
        }
        setTimeout(() => this.poll(), 5000)
    }

    notifyConfirmed(item: Purchase) {
        new Notification({
            type: 'confirmed_purchase',
            title: 'Box purchased',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                box_id: item.box_id,
            },
            read: false,
        }).push(true);
    }
}

export const userPurchaseStore = perUserStore(UserPurchases);
