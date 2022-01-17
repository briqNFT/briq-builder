import type { Provider, Signer } from 'starknet';

import SetABI from './set_abi.json'
import ExtendedContract from './Abstraction'

export default class SetContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(SetABI, address, provider)
    }

    async initialize(briq_contract_address: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("initialize", { briq_contract_address });
    }

    async get_all_tokens_for_owner(owner: string): Promise<string[]>
    {
        return (await this.call("get_all_tokens_for_owner", { owner: owner })).tokens as string[];
    }

    async mint(owner: string, token_id: string, bricks: Array<string>)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint", { owner, token_id, bricks });
    }

    async disassemble(owner: string, token_id: string, bricks: Array<string>)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("disassemble", { owner, token_id, bricks });
    }

    async transfer_from(sender: string, recipient: string, token_id: string, bricks: Array<string>)
    {
        if (!((this.provider as Signer).address))
           throw new Error("Provider is not a signer");
        return await this.invoke("transfer_from", { sender, recipient, token_id, bricks });
    }

    async owner_of(token_id: string)
    {
        return (await this.call("owner_of", { token_id })).res as string;
    }
}
