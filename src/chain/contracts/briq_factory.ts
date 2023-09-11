import type { AccountInterface, Provider } from 'starknet';
import { Contract, FunctionAbi } from 'starknet';
import { number, uint256, shortString } from 'starknet';

import BriqFactoryABI from './starknet-testnet/briq_factory.json';
import { maybeStore } from '../WalletLoading';
import type ERC20Contract from './erc20';
import { getProvider } from '../BlockchainProvider';
import type { ADDRESSES } from '../Contracts';

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

    async getParameters() {
        const provider = getProvider().value!;

        const current_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_current_t())).result[0] as string;
        const surge_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_surge_t())).result[0] as string;

        return {
            current_t,
            surge_t,
        }
    }

    buyTransaction(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        return [
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, uint256.bnToUint256(number.toBN(approval))),
            this.contract.populateTransaction.buy(`${amount}`),
            erc20_contract.contract.populateTransaction['approve'](this.contract.address, uint256.bnToUint256(number.toBN(0))),
        ]
    }

    async buy(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        return await (this.contract.providerOrAccount as AccountInterface).execute(this.buyTransaction(erc20_contract, amount, approval));
    }
}

export class BriqFactoryOnDojoContract {
    world_address: string;
    executor_address: string;
    constructor(_: string, __: Provider, addresses: typeof ADDRESSES['starknet-testnet-dojo']) {
        this.world_address = addresses.world;
        this.executor_address = addresses.executor;
    }

    connect(_: string, __: Provider, addresses: typeof ADDRESSES['starknet-testnet-dojo']) {
        this.world_address = addresses.world;
        this.executor_address = addresses.executor;
    }

    async getParameters() {
        const briqFactoryStore = await getProvider().value!.provider!.callContract({
            contractAddress: this.world_address,
            entrypoint: 'entity',
            calldata: [shortString.encodeShortString('BriqFactoryStore'), 1, 1, 0, 4],
        })

        //const current_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_current_t())).result[0] as string;
        //const surge_t = (await provider.provider!.callContract(this.contract.populateTransaction.get_surge_t())).result[0] as string;

        const DECAY_PER_SECOND = BigInt('6337791082068820');
        const SURGE_DECAY_PER_SECOND = BigInt('413400000000000000');

        const timeDelta = Math.round(Date.now() / 1000 - parseInt(briqFactoryStore.result[4], 16));
        const current_t = BigInt(briqFactoryStore.result[2]) - DECAY_PER_SECOND * BigInt(timeDelta);
        const surge_t = BigInt(briqFactoryStore.result[3]) - SURGE_DECAY_PER_SECOND * BigInt(timeDelta);

        return {
            current_t: current_t < 0 ? '0x0' : '0x' + current_t.toString(16),
            surge_t: surge_t < 0 ? '0x0' : '0x' + surge_t.toString(16),
        }
    }

    buyTransaction(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        return [
            erc20_contract.contract.populateTransaction['approve'](this.executor_address, uint256.bnToUint256(number.toBN(approval))),
            {
                contractAddress: this.world_address,
                entrypoint: 'execute',
                calldata: ['BriqFactoryMint', 2, 1, amount], // array calldata, 1 is for material
            },
            erc20_contract.contract.populateTransaction['approve'](this.executor_address, uint256.bnToUint256(number.toBN(0))),
        ]
    }

    async buy(erc20_contract: ERC20Contract, amount: number, approval: number.BigNumberish) {
        await maybeStore.value!.ensureEnabled();
        return await (maybeStore.value!.signer as AccountInterface).execute(this.buyTransaction(erc20_contract, amount, approval));
    }
}
