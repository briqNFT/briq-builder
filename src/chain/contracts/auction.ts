import type { Provider } from '@/starknet_wrapper';
import type { AccountInterface, FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import { toBN } from '@/starknet_wrapper';
import { bnToUint256 } from 'starknet/utils/uint256';

import ABI from './starknet-testnet/auction.json';
import type ERC20Contract from './erc20';
import { toRaw } from 'vue';
import { BigNumberish } from 'starknet/utils/number';

export default class AuctionContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(ABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    approveAndBid(erc20_contract: ERC20Contract, box_token_id: number, index: number, amount: BigNumberish) {
        return (this.contract.providerOrAccount as AccountInterface).execute([
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, bnToUint256(toBN(amount))),
            this.contract.populateTransaction.make_bid({
                bidder: this.contract.providerOrAccount.address,
                auction_index: index,
                box_token_id: box_token_id,
                bid_amount: amount,
            }),
        ]);
    }
}
