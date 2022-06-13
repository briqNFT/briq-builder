import type { Provider } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';

import { backendManager } from '@/Backend';

import ABI from './starknet-testnet/box.json';

export default class BoxContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async getUnopenedBoxes(owner: string): Promise<string[]> {
        try {
            return backendManager.post('mock_chain/getUnopenedBoxes', { owner: owner })
        } catch(err) {
            console.error(err);
            return [];
        }
    }

    async unbox(owner: string, token_id: string) {
        return this.contract.unbox_(owner, token_id);
    }
}
