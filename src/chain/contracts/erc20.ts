import type { Provider } from '@/starknet_wrapper';
import type { AccountInterface, FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { uint256ToBN } from 'starknet/utils/uint256';
import { maybeStore } from '../WalletLoading';

import ABI from './starknet-testnet/erc20.json';

export default class ERC20Contract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    connect(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async getBalance(): Promise<string> {
        const result = await this.contract.balanceOf(maybeStore.value?.userWalletAddress);
        return uint256ToBN(result.balance).toString();
    }
}
