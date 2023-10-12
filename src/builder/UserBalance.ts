import { perUserStorable, perUserStore } from './PerUserStore';

import { Fetchable } from '@/DataFetching';
import * as starknet from 'starknet';

class UserBalance implements perUserStorable {
    user_id!: string;
    balance = new Fetchable<starknet.num.BigNumberish>();

    async onEnter() {
        await this.balance.fetch(async () => (await import('@/Dispatch')).contractStore.eth_bridge_contract!.getBalance());
    }

    asEth(): number | undefined {
        if (this.balance._status !== 'LOADED')
            return undefined;
        return Number(BigInt(this.balance._data) + BigInt('1000000000000000')) / 1000;
    }
}

export const userBalance = perUserStore('UserBalance', UserBalance);
userBalance.setup();

