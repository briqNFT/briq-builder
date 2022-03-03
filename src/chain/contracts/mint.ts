import type { Provider, Signer } from 'starknet';

import MintABI from './testnet/mint.json'
import ExtendedContract from './Abstraction';

export default class MintContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(MintABI, address, provider)
    }

    async has_minted(user: string): Promise<boolean>
    {
        try {
            return parseInt((await this.call("amountMinted", { user })).res as string, 16) > 0;
        } catch(err) {
            throw err;
        }
    }

    async mint(user: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint", { user });
    }
}