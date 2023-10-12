import type { Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';

import ABI from './starknet-testnet/box_nft.json';
import { maybeStore } from '../WalletLoading';

export default class BoxContract {
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

    async unbox(owner: string, token_id: string) {
        await maybeStore.value!.ensureEnabled();
        return this.contract.unbox_(owner, token_id);
    }
}

export class BoxDojoContract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    static ABI = [
        {
            'inputs': [
                {
                    'name': 'token_id',
                    'type': 'felt',
                },
            ],
            'name': 'unbox',
            'outputs': [],
            'type': 'function',
        },
    ] as const;

    connect(address: string, provider: Provider) {
        this.contract = new Contract(BoxDojoContract.ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async unbox(_owner: string, token_id: string) {
        await maybeStore.value!.ensureEnabled();
        return this.contract.unbox(token_id);
    }
}
