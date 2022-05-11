import type { Provider } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';
import { toHex } from '@/starknet_wrapper';

import BriqABI from './starknet-testnet/briq_interface.json';

export default class BriqContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(BriqABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async mintFT(owner: string, material: string, qty: number) {
        return await this.contract.mintFT(owner, material, `${qty}`);
    }

    // TODO: use multicall, which would be slightly more efficient
    async fullBalanceOf(owner: string) {
        const res = await this.contract.fullBalanceOf_(owner);
        const ret = {}
        for (const bal of res.balances)
            ret[bal.material] = {
                ft_balance: parseInt(toHex(bal.balance), 16),
                nft_ids: [], // (await this.contract.balanceDetailsOfMaterial_(owner, bal.material)).nft_ids.map(x => toHex(x)),
            }

        return ret;
    }

    async balanceDetailsOf(owner: string, material: string) {
        const res = await this.contract.balanceDetailsOf(owner, material);
        return {
            ft_balance: parseInt(res.ft_balance),
            nft_ids: res.nft_ids.map((x) => toHex(x)) as string[],
        };
    }

    async balanceOf(owner: string, material: string) {
        const res = await this.contract.balanceOf(owner, material);
        return parseInt(res.balance.toString());
    }

}
