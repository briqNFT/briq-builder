import type { Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';

import BriqFactoryABI from './starknet-testnet/briq_factory.json';
import { maybeStore } from '../WalletLoading';

export default class BriqContract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    connect(address: string, provider: Provider) {
        this.contract = new Contract(BriqFactoryABI as FunctionAbi[], address, provider);
    }
    getAddress() {
        return this.contract.address;
    }

    async buy(amount: number) {
        await maybeStore.value!.ensureEnabled();
        return await this.contract.buy(`${amount}`);
    }
}
