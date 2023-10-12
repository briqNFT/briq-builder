import type { Provider } from 'starknet';
import type { AccountInterface, FunctionAbi } from 'starknet';
import { Contract } from 'starknet';
import * as starknet from 'starknet';
import { cairo } from 'starknet';

import ABI from './starknet-testnet/auction_onchain.json';
import type ERC20Contract from './erc20';
import { maybeStore } from '../WalletLoading';

export default class OnchainAuctionContract {
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

    async approveAndBid(erc20_contract: ERC20Contract, auction_id: string, amount: starknet.num.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        const bidTx = this.contract.populateTransaction.make_bid(
            auction_id,
            amount,
        )
        if (amount == 0)
            return (this.contract.providerOrAccount as AccountInterface).execute([bidTx]);
        return (this.contract.providerOrAccount as AccountInterface).execute([
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, cairo.uint256(amount)),
            bidTx,
        ]);
    }
}
