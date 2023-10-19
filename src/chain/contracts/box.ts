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
    addresses!: Record<string, string>;

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

    constructor(address: string, provider: Provider, addresses: Record<string, string>) {
        this.connect(address, provider, addresses);
    }

    connect(address: string, provider: Provider, addresses: Record<string, string>) {
        this.contract = new Contract(BoxDojoContract.ABI as FunctionAbi[], address, provider);
        this.addresses = addresses;
    }

    getAddress() {
        return this.contract.address;
    }

    _getContractAddress(token_id: string) {
        return {
            0: this.addresses.box_nft_sp,
            1: this.addresses.box_nft_sp,
            2: this.addresses.box_nft_sp,
            3: this.addresses.box_nft_sp,
            4: this.addresses.box_nft_sp,
            5: this.addresses.box_nft_sp,
            6: this.addresses.box_nft_sp,
            7: this.addresses.box_nft_sp,
            8: this.addresses.box_nft_sp,
            9: this.addresses.box_nft_sp,
            10: this.addresses.box_nft_briqmas,
        }[+token_id] || this.addresses.box_nft_sp;
    }

    async unbox(_owner: string, token_id: string) {
        await maybeStore.value!.ensureEnabled();
        // Change the target contract (hacky but meh)
        this.contract.address = this._getContractAddress(token_id);
        return this.contract.unbox(token_id);
    }
}
