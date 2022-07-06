import { Notif, notificationsManager } from '@/Notifications';
import { h } from 'vue';
import BidNotifVue from './BidNotif.vue';

type Ser = {
    bidValue: number
};

export class BidNotif extends Notif {
    type = 'box_bid';
    value: number;

    constructor(data: Ser) {
        super();
        this.value = data.bidValue;
    }

    serialize(): Ser {
        return {
            bidValue: this.value,
        };
    }

    render() {
        return BidNotifVue;
    }
}

notificationsManager.register('box_bid', BidNotif);
