import type { Provider } from '@/starknet_wrapper';
import type { AccountInterface, FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { toBN } from '@/starknet_wrapper';
import { bnToUint256 } from 'starknet/utils/uint256';

import ABI from './starknet-testnet/auction.json';
import type ERC20Contract from './erc20';

export default class AuctionContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    approveAndBid(erc20_contract: ERC20Contract, box_token_id: number, index: number, amount: number) {
        return (this.contract.providerOrAccount as AccountInterface).execute([
            erc20_contract.contract.populateTransaction.approve(this.contract.address, bnToUint256(toBN(amount))),
            this.contract.populateTransaction.make_bid({
                bidder: this.contract.providerOrAccount.address,
                auction_index: 0,
                box_token_id: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
                bid_amount: 10,
            }),
        ]);
    }
}
