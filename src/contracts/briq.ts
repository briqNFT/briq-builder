import type { AddTransactionResponse } from 'starknet';
import type { Provider, Signer } from 'starknet';

import BriqABI from './testnet/proxy_briq_backend.json'

import ExtendedContract from './Abstraction'

export default class BriqContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(BriqABI, address, provider)
    }

    async balanceDetailsOf(owner: string, material: string)
    {
        return (await this.call("balanceDetailsOf", { owner, material })) as { ft_balance: string, nft_ids: string[] };
    }

    async balanceOf(owner: string, material: string)
    {
        return parseInt((await this.call("balanceOf", { owner, material })).balance as string, 16);
    }
}
