import type { AccountInterface, Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';
import { cairo } from 'starknet';

import BriqFactoryABI from './starknet-testnet/briq_factory.json';
import { maybeStore } from '../WalletLoading';
import type ERC20Contract from './erc20';
import { getProvider } from '../BlockchainProvider';
import { migrateBriqsIfNeeded } from './migration';

export default class BriqContract {
    contract!: Contract;
    constructor(address: string, provider: Provider, addresses: any) {
        this.connect(address, provider, addresses);
    }

    connect(address: string, provider: Provider, _: any) {
        this.contract = new Contract(BriqFactoryABI as FunctionAbi[], address, provider);
    }
    getAddress() {
        return this.contract.address;
    }

    async getParameters() {
        const provider = getProvider().value!;

        const current_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_current_t(), 'latest')).result[0] as string;
        const surge_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_surge_t(), 'latest')).result[0] as string;

        return {
            current_t,
            surge_t,
        }
    }

    buyTransaction(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        return migrateBriqsIfNeeded([
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, cairo.uint256(BigInt(approval))),
            this.contract.populateTransaction.buy(`${amount}`),
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, cairo.uint256(0n)),
        ]);
    }

    async buy(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        return await (this.contract.providerOrAccount as AccountInterface).execute(this.buyTransaction(erc20_contract, amount, approval));
    }
}

export class BriqFactoryOnDojoContract extends BriqContract {
    buyTransaction(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        return [
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, cairo.uint256(BigInt(approval))),
            {
                contractAddress: this.contract.address,
                entrypoint: 'buy',
                calldata: [1, `${amount}`],
            },
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, cairo.uint256(0n)),
        ]
    }
}
