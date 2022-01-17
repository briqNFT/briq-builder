import type { Provider, Signer } from 'starknet';

import MintABI from './mint_proxy_abi.json'
import ExtendedContract from './Abstraction';

export default class MintContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(MintABI, address, provider)
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