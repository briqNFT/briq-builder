import { Notif, notificationsManager } from '@/Notifications';
import BidNotifVue from '@/components/builder/genesis/BidNotif.vue';

type Ser = {
    value: number,
    item: string,
};

export class BidNotif extends Notif {
    type = 'box_bid';
    value: number;
    item: string;

    constructor(data: Ser) {
        super(data);
        this.value = data.value;
        this.item = data.item;
    }

    serialize(): Ser {
        return {
            value: this.value,
            item: this.item,
        };
    }

    get summary() {
        return `Your bid of ${this.value} is being processed.`;
    }

    render() {
        return BidNotifVue;
    }
}

notificationsManager.register('box_bid', BidNotif);
