import type { AddTransactionResponse } from 'starknet';
import type { Provider, Signer } from 'starknet';

import BriqABI from './testnet/briq_impl.json'

import ExtendedContract from './Abstraction'

export default class BriqContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(BriqABI, address, provider)
    }

    // Admin stuff
    async setSet(contractStore: any)
    {
        return (await this.invoke("setSetAddress", { address: contractStore.set.connectedTo }));
    }
    
    async setMint(contractStore: any)
    {
        return (await this.invoke("setMintContract", { address: contractStore.mint.connectedTo }));
    }
    

    async balanceDetailsOf(owner: string, material: string)
    {
        try {
            return (await this.call("balanceDetailsOf", { owner, material })) as { ft_balance: string, nft_ids: string[] };
        } catch(err) {
            throw err;
        }
    }

    async balanceOf(owner: string, material: string)
    {
        try {
            return parseInt((await this.call("balanceOf", { owner, material })).balance as string, 16);
        } catch(err) {
            throw err;
        }
    }
}
