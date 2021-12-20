import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';

import { AddTransactionResponse } from 'starknet';

import { Args, Contract, Provider, Signer } from 'starknet';

import SetABI from './mint_proxy_abi.json'

export default class MintContract extends Contract
{
    constructor(address: string, provider: Provider)
    {
        super(SetABI, address, provider)
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