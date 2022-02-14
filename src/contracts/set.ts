import type { Provider, Signer } from 'starknet';
import type { SetData } from '../builder/SetData';
import { getSelectorFromName } from 'starknet/utils/stark';


import { computeHashOnElements } from 'starknet/utils/hash';

import SetABI from './testnet/set_impl.json'
import ExtendedContract from './Abstraction'

export default class SetContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(SetABI, address, provider)
    }

    // Admin stuff
    async setBriq(contractStore: any)
    {
        try {
            return (await this.invoke("setBriqAddress", { address: contractStore.briq.connectedTo }));
        } catch (err) {
            throw err;
        }
    }

    async balanceDetailsOf(owner: string): Promise<string[]>
    {
        try {
            return (await this.call("balanceDetailsOf", { owner: owner })).token_ids as string[];
        } catch (err) {
            throw err;
        }
    }

    // TODO: add URI
    precomputeTokenId(address: string, token_id_hint: string)
    {
        let hash = computeHashOnElements([address, token_id_hint]);
        hash = hash.substring(2).padStart(63, "0");
        // Hash is 0x prefixed string. JS numbers are not big enough to parse this, and I'm lazy.
        // We need to 0 out the last 59 bits, which means zero out the last 14 chars (14*4 = 56), and bit-and the 15th last with b1000 == 8.
        hash = (hash.substring(0, 48) + (parseInt(hash[48], 16) & 8).toString(16)).padEnd(63, "0");
        // Remove leading zeroes.
        if (hash[0] === "0")
            hash = hash.replace(/^0+/, '');
        return "0x" + hash;
    }

    async assemble(owner: string, token_id_hint: string, briqs: { material: string, id?: string }[], uri: string)
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

        let split_uri = [] as string[];
        for (let i = 0; i < uri.length; i += 31)
        {
            let s = [];
            for (let c = i; c < Math.min(uri.length, i + 31); ++c)
            {
                let code = uri.charCodeAt(c);
                if (code > 255)
                    throw new Error("Only extended ASCII set is supported");
                s.push(code.toString(16))
            }
            split_uri.push("0x" + s.join(""));
        }

        return await (this.provider as Signer).invokeFunction(this.connectedTo!, getSelectorFromName("assemble"), [
            owner,
            token_id_hint,
            "" + fts.length,
            ...fts.flat(),
            "" + nfts.length,
            ...nfts,
            "" + split_uri.length,
            ...split_uri
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

    async transferOneNFT(sender: string, recipient: string, token_id: string)
    {
        if (!((this.provider as Signer).address))
           throw new Error("Provider is not a signer");
        return await this.invoke("transferOneNFT", { sender, recipient, token_id });
    }

    async ownerOf(token_id: string)
    {
        return (await this.call("ownerOf_", { token_id })).owner as string;
    }
}

import LegacySetABI from './testnet-legacy/set_abi.json'

export class LegacySetContract extends ExtendedContract
{
    constructor(address: string, provider: Provider)
    {
        super(LegacySetABI, address, provider)
    }

    async balanceDetailsOf(owner: string): Promise<string[]>
    {
        try {
            return (await this.call("get_all_tokens_for_owner", { owner: owner })).tokens as string[];
        } catch (err) {
            return [];
        }
    }

    async ownerOf(token_id: string)
    {
        try {
            return (await this.call("owner_of", { token_id })).res as string;
        } catch (err) {
            return "0x0";
        }
    }

    async disassemble(owner: string, token_id: string, bricks: Array<string>)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("disassemble", { owner, token_id, bricks });
    }
}
