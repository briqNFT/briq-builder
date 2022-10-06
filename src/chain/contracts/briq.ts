import type { Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';

import BriqABI from './starknet-testnet/briq.json';
import { maybeStore } from '../WalletLoading';

export default class BriqContract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    connect(address: string, provider: Provider) {
        this.contract = new Contract(BriqABI as FunctionAbi[], address, provider);
    }
    getAddress() {
        return this.contract.address;
    }

    async mintFT(owner: string, material: string, qty: number) {
        await maybeStore.value!.ensureEnabled();
        return await this.contract.mintFT(owner, material, `${qty}`);
    }
}
