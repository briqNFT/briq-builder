import { Notif, notificationsManager } from '@/Notifications';
import BidNotifVue from '@/components/builder/genesis/BidNotif.vue';
import { toBN } from 'starknet/utils/number';

type Ser = {
    value: string,
    item: string,
    tx_hash: string | undefined,
};

export class BidNotif extends Notif {
    type = 'box_bid';
    value: string;
    item: string;
    tx_hash: string | undefined;

    constructor(data: Ser) {
        super(data);
        this.value = data.value;
        this.item = data.item;
        this.tx_hash = data.tx_hash;
    }

    serialize(): Ser {
        return {
            value: this.value,
            item: this.item,
            tx_hash: this.tx_hash,
        };
    }

    get summary() {
        console.log(this.value)
        return `Your bid of ${toBN(this.value).div(toBN('' + 10**16)).toNumber() / 100} is being processed.`;
    }

    render() {
        return BidNotifVue;
    }
}

notificationsManager.register('box_bid', BidNotif);
