import type { Provider } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';
import { toHex } from '@/starknet_wrapper';

import ABI from './starknet-testnet/auction.json';

export default class BriqContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async makeBid(box_token_id: int) {
        await this.contract.providerOrAccount.execute({
            contractAddress: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
            entrypoint: 'approve',
            calldata: [this.contract.address, 0, 103203923],
        })
        return await this.contract.make_bid({
            payer: this.contract.providerOrAccount.address,
            payer_erc20_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
            box_token_id: 1,
            bid_amount: 10,
        });
    }
}
