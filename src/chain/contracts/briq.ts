import type { AddTransactionResponse } from 'starknet';
import type { Provider, Signer } from 'starknet';

import BriqABI from './testnet/briq_impl.json'

import ExtendedContract from './Abstraction'

export default class BriqContract
{
    contract: ExtendedContract;
    constructor(address: string, provider: Provider)
    {
        this.contract = new ExtendedContract(BriqABI, address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    // Admin stuff
    /*
    async setSet(contractStore: any)
    {
        return (await this.invoke("setSetAddress", { address: contractStore.set.address }));
    }
    
    async setMint(contractStore: any)
    {
        return (await this.invoke("setMintContract", { address: contractStore.mint.address }));
    }*/

    async mint(owner: string, qty: number)
    {
        return await this.contract.mintFT(owner, "1", `${qty}`);
    }

    async balanceDetailsOf(owner: string, material: string)
    {
        try {
            let res = await this.contract.balanceDetailsOf(owner, material);
            return {
                ft_balance: parseInt(res.ft_balance),
                nft_ids: res.nft_ids.toString() as string[]
            }
        } catch(err) {
            throw err;
        }
    }

    async balanceOf(owner: string, material: string)
    {
        try {
            let res = (await this.contract.balanceOf(owner, material));
            return parseInt(res.balance.toString());
        } catch(err) {
            throw err;
        }
    }
}
