import type { Provider } from 'starknet';
import type { FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { uint256 } from 'starknet';
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
        return uint256.uint256ToBN(result.balance).toString();
    }
}
