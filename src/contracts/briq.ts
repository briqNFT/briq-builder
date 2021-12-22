import { AddTransactionResponse } from 'starknet';

import { Provider, Signer } from 'starknet';

import BriqABI from './briq_abi.json'
import ProdBriqABI from './briq_abi_prod.json'

import ExtendedContract from './Abstraction'

export default class BriqContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(BriqABI, address, provider)
    }

    async initialize(set_contract_address: string, mint_contract_address: string, erc20_contract_address: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("initialize", { set_contract_address, mint_contract_address, erc20_contract_address });
    }

    async get_all_tokens_for_owner(owner: string)
    {
        return (await this.call("get_all_tokens_for_owner", { owner: owner })).tokens;
    }

    async mint_multiple(material: number, token_start: number, nb: number): Promise<AddTransactionResponse>
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint_multiple", { owner: (this.provider as Signer).address, material: "" + material, token_start: "" + token_start, nb: "" + nb });
    }
}

export class ProdBriqContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(ProdBriqABI, address, provider)
    }

    async initialize(set_contract_address: string, mint_contract_address: string, erc20_contract_address: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("initialize", { set_contract_address, mint_contract_address });
    }

    async get_all_tokens_for_owner(owner: string)
    {
        return (await this.call("get_all_tokens_for_owner", { owner: owner })).bricks;
    }

    async mint_multiple(material: number, token_start: number, nb: number): Promise<AddTransactionResponse>
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint_multiple", { owner: (this.provider as Signer).address, material: "" + material, token_start: "" + token_start, nb: "" + nb });
    }
}