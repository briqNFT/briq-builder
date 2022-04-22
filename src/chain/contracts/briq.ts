import type { AddTransactionResponse } from '@/starknet_wrapper';
import type { Provider, Signer } from '@/starknet_wrapper';

import { toHex } from '@/starknet_wrapper';

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

    async mintFT(owner: string, material: string, qty: number)
    {
        return await this.contract.mintFT(owner, material, `${qty}`);
    }

    async balanceDetailsOf(owner: string, material: string)
    {
        try {
            let res = await this.contract.balanceDetailsOf(owner, material);
            return {
                ft_balance: parseInt(res.ft_balance),
                nft_ids: res.nft_ids.map(x => toHex(x)) as string[]
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

    /*
    async multiBalanceOf(owner: string)
    {
        const materials = await (async () => {
            try {
                return await this.contract.materialsOf(owner).materials.map(x => x.toString());
            } catch(_) {
                console.error(_);
                return [];
            }
        })();
        
        let stuff = [];
        for (let material of materials)
            stuff.push(this.contract.populate("balanceDetailsOf", [owner, material]));
        console.log(stuff);
    }*/
}
