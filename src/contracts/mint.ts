import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';

import { AddTransactionResponse } from 'starknet';

import { Args, Contract, Provider, Signer } from 'starknet';

import MintABI from './mint_proxy_abi.json'
import ProdMintABI from './mint_proxy_abi_prod.json'
import ExtendedContract from './Abstraction';
import { PROD } from '../Meta';

export default class MintContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(MintABI, address, provider)
    }

    async has_minted(user: string): boolean
    {
        return parseInt((await this.call("amount_minted", { user })).res, 16) > 0;
    }

    async mint(user: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        const amount = PROD ? "100" : "20";
        return await this.invoke("mint_amount", { user, amount: amount });
    }
}

export class ProdMintContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(ProdMintABI, address, provider)
    }

    async has_minted(user: string): boolean
    {
        return !!parseInt((await this.call("has_minted", { user })).res, 16);
    }

    async mint(user: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint", { user });
    }
}