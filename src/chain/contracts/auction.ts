import type { Provider } from 'starknet';
import type { AccountInterface, FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import * as starknet from 'starknet';
import { uint256 } from 'starknet';

import ABI from './starknet-testnet/auction.json';
import type ERC20Contract from './erc20';
import { maybeStore } from '../WalletLoading';

export default class AuctionContract {
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

    async approveAndBid(erc20_contract: ERC20Contract, box_token_id: number, index: number, amount:number.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        const bidTx = this.contract.populateTransaction.make_bid({
            bidder: this.contract.providerOrAccount.address,
            auction_index: index,
            box_token_id: box_token_id,
            bid_amount: amount,
        })
        if (amount == 0)
            return (this.contract.providerOrAccount as AccountInterface).execute([bidTx]);
        return (this.contract.providerOrAccount as AccountInterface).execute([
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, uint256.bnToUint256(starknet.number.toBN(amount))),
            bidTx,
        ]);
    }
}
