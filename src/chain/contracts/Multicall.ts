import type { Provider, Signer } from '@/Starknet';
import type { SetData } from '../../builder/SetData';
import { toHex } from '@/Starknet';

import { computeHashOnElements } from '@/Starknet';

const MulticallABI = [
    {
        inputs: [
            { name: 'calls_len', type: 'felt' },
            { name: 'calls', type: 'felt*' },
        ],
        name: 'aggregate',
        outputs: [
            { name: 'block_number', type: 'felt' },
            { name: 'result_len', type: 'felt' },
            { name: 'result', type: 'felt*' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

export default class MulticallContract {
    contract: ExtendedContract;
    constructor(address: string, provider: Provider) {
        this.contract = new ExtendedContract(MulticallABI, address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    aggregate(calls: any[]) {
        return this.contract.aggregate(calls);
    }
}
