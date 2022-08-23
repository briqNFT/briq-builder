import { perUserStorable, perUserStore } from './PerUserStore';

import { Fetchable } from './GenesisStore';
import { BigNumberish, toBN } from 'starknet/utils/number';

class UserBalance implements perUserStorable {
    user_id!: string;
    balance = new Fetchable<BigNumberish>();

    async onEnter() {
        await this.balance.fetch((await import('@/Dispatch')).contractStore.eth_bridge_contract!.getBalance());
    }

    asEth(): number | undefined {
        if (this.balance._status !== 'LOADED')
            return undefined;
        return toBN(this.balance._data).div(toBN('' + 10**15)).toNumber() / 1000;
    }
}

export const userBalance = perUserStore(UserBalance);
userBalance.setup();

