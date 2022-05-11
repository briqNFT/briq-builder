import type { Provider } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';

import MintABI from './testnet/mint.json';

export default class MintContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(MintABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async has_minted(user: string): Promise<boolean> {
        return parseInt(await this.contract.amountMinted(user)) > 0;
    }

    async mint(user: string) {
        return await this.contract.mint(user);
    }
}
