import type { Provider } from 'starknet';
import type { FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { cairo } from 'starknet';
import { maybeStore } from '../WalletLoading';
import { getProvider } from '../BlockchainProvider';

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
        const result = (await getProvider().value.provider?.callContract(this.contract.populateTransaction.balanceOf(maybeStore.value?.userWalletAddress), 'latest')).result;
        return cairo.uint256({ low: result[0], high: result[1] }).toString();
    }
}
