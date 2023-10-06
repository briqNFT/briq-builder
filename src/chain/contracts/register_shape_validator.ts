import type { Provider } from 'starknet';
import type { FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { uint256 } from 'starknet';
import { maybeStore } from '../WalletLoading';
import { getProvider } from '../BlockchainProvider';

const ABI = [
    {
        'type': 'function',
        'name': 'execute',
        'inputs': [
            {
                'name': 'world',
                'type': 'dojo::world::IWorldDispatcher',
            },
            {
                'name': 'attribute_group_id',
                'type': 'core::integer::u64',
            },
            {
                'name': 'attribute_id',
                'type': 'core::integer::u64',
            },
            {
                'name': 'class_hash',
                'type': 'core::starknet::class_hash::ClassHash',
            },
        ],
        'outputs': [],
        'state_mutability': 'view',
    },
];

export default class RegisterShapeValidatorContract {
    contract!: Contract;
    world_address!: string;
    constructor(address: string, provider: Provider, addresses: Record<string, string>) {
        this.connect(address, provider, addresses);
    }

    connect(address: string, provider: Provider, addresses: Record<string, string>) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
        this.world_address = addresses.world;
    }

    getAddress() {
        return this.contract.address;
    }

    async get_registered_shape_verifier(attributeGroupId: string, attributeId: string) {
        return await this.contract.providerOrAccount.callContract({
            contractAddress: this.world_address,
            calldata: [
                'ShapeValidator',
                2, attributeGroupId, attributeId, // keys
                0, // offset
                2, // length
                1, 251, // layout
            ],
            entrypoint: 'entity',
        });
    }

    register(attributeGroupId: string, attributeId: string, classHash: string) {
        // Declare contract
    }
}
