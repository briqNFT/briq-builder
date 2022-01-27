import type { Provider, Signer } from 'starknet';
import type { SetData } from '../builder/SetData';
import { getSelectorFromName } from 'starknet/utils/stark';

import SetABI from './testnet/proxy_set_backend.json'
import ExtendedContract from './Abstraction'

export default class SetContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(SetABI, address, provider)
    }

    async balanceDetailsOf(owner: string): Promise<string[]>
    {
        return (await this.call("balanceDetailsOf", { owner: owner })).token_ids as string[];
    }

    async assemble(owner: string, token_id_hint: string, briqs: { material: string, id?: string }[])
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");

        let fungibles = {} as { [mat: string]: number };
        let nfts = [] as string[];
        for (let briq of briqs)
        {
            if (briq.id)
                nfts.push(briq.id);
            else
            {
                if (!fungibles[briq.material])
                    fungibles[briq.material] = 0;
                ++fungibles[briq.material];
            }
        }
        let fts = [];
        for (let ft in fungibles)
            fts.push([ft, "" + fungibles[ft]]);

        return await (this.provider as Signer).invokeFunction(this.connectedTo!, getSelectorFromName("assemble"), [
            owner,
            token_id_hint,
            "" + fts.length,
            ...fts.flat(),
            "" + nfts.length,
            ...nfts
        ]);
    }

    async disassemble(owner: string, token_id: string, set: SetData)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");

        let fungibles = {} as { [mat: string]: number };
        let nfts = [] as string[];
        set.forEach((briq, _) => {
            if (briq.id)
                nfts.push(briq.id);
            else
            {
                if (!fungibles[briq.material])
                    fungibles[briq.material] = 0;
                ++fungibles[briq.material];
            }
        });
        let fts = [];
        for (let ft in fungibles)
            fts.push([ft, "" + fungibles[ft]]);

        return await (this.provider as Signer).invokeFunction(this.connectedTo!, getSelectorFromName("disassemble"), [
            owner,
            token_id,
            "" + fts.length,
            ...fts.flat(),
            "" + nfts.length,
            ...nfts
        ]);
    }
    /*
    async transfer_from(sender: string, recipient: string, token_id: string, bricks: Array<string>)
    {
        if (!((this.provider as Signer).address))
           throw new Error("Provider is not a signer");
        return await this.invoke("transfer_from", { sender, recipient, token_id, bricks });
    }*/

    async ownerOf(token_id: string)
    {
        return (await this.call("ownerOf", { token_id })).owner as string;
    }
}
