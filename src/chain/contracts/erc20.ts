import type { Provider } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';

import ABI from './starknet-testnet/erc20.json';

export default class ERC20Contract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }
}
