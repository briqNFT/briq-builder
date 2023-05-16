import type { AccountInterface, Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';
import { number, uint256 } from 'starknet';

import BriqFactoryABI from './starknet-testnet/briq_factory.json';
import { maybeStore } from '../WalletLoading';
import type ERC20Contract from './erc20';

export default class BriqContract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    connect(address: string, provider: Provider) {
        this.contract = new Contract(BriqFactoryABI as FunctionAbi[], address, provider);
    }
    getAddress() {
        return this.contract.address;
    }

    async buy(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        return await (this.contract.providerOrAccount as AccountInterface).execute([
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, uint256.bnToUint256(number.toBN(approval))),
            this.contract.populateTransaction.buy(`${amount}`),
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, uint256.bnToUint256(number.toBN(0))),
        ]);
    }
}
