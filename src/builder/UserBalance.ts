import { perUserStorable, perUserStore } from './PerUserStore';

import { Fetchable } from '@/DataFetching';
import * as starknet from 'starknet';

class UserBalance implements perUserStorable {
    user_id!: string;
    balance = new Fetchable<number.BigNumberish>();

    async onEnter() {
        await this.balance.fetch(async () => (await import('@/Dispatch')).contractStore.eth_bridge_contract!.getBalance());
    }

    asEth(): number | undefined {
        if (this.balance._status !== 'LOADED')
            return undefined;
        return starknet.number.toBN(this.balance._data).div(starknet.number.toBN('' + 10**15)).toNumber() / 1000;
    }
}

export const userBalance = perUserStore('UserBalance', UserBalance);
userBalance.setup();

