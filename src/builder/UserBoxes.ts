import { backendManager } from '@/Backend';
import { perUserStore } from './PerUserStore';
import { Notification } from '@/Notifications';
import { GeneralizedUserItem } from './UserItem';

class UserBoxesStore extends GeneralizedUserItem {
    polling!: number;

    _serialize() {
        const meta = {};
        for (const id in this.metadata)
            if (this.metadata[id].updates.length)
                meta[id] = this.metadata[id];
        return {
            boxes: this._tokenNames || [],
            metadata: meta,
        }
    }

    _deserialize(data: any) {
        this._tokenNames = data.boxes;
        this.metadata = data.metadata;
    }

    async fetchData() {
        return (await backendManager.fetch(`v1/user/data/${this.user_id}`)).box_token_ids;
    }

    onEnter() {
        /*
        this.metadata['briqmas/briqmas_tree'] = {
            token_name: 'briqmas/briqmas_tree',
            updates: [{
                tx_hash: '0xcafe',
                block: undefined,
                status: 'TENTATIVE_PENDING',
                date: Date.now(),
            },
            ],
        }/*
        setTimeout(() => {
            this.metadata['starknet_city_ongoing/spaceman'].updates[0].status = 'TENTATIVE_PENDING'
        }, 6000);
        */
        super.onEnter();
        this.polling = setInterval(() => this._fetchData(), 10000);
    }

    onLeave() {
        if (this.polling)
            clearTimeout(this.polling);
    }

    get availableBoxes() {
        return this._tokenNames;
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
