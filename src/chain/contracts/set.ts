import type { Provider, Signer } from '@/starknet_wrapper';
import type { SetData } from '../../builder/SetData';
import { toHex } from '@/starknet_wrapper';
import { Contract, FunctionAbi } from 'starknet';

import { computeHashOnElements } from '@/starknet_wrapper';

import SetABI from './starknet-testnet/set_interface.json';

export default class SetContract {
    contract: Contract;
    constructor(address: string, provider: Provider) {
        this.contract = new Contract(SetABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async ownerOf(token_id: string) {
        return toHex((await this.contract.ownerOf_(token_id)).owner);
    }

    async balanceDetailsOf(owner: string): Promise<string[]> {
        const res = await this.contract.balanceDetailsOf_(owner);
        return res.token_ids.map((x) => toHex(x));
    }

    // TODO: add URI
    precomputeTokenId(address: string, token_id_hint: string) {
        let hash = computeHashOnElements([address, token_id_hint]);
        hash = hash.substring(2).padStart(63, '0');
        // Hash is 0x prefixed string. JS numbers are not big enough to parse this, and I'm lazy.
        // We need to 0 out the last 59 bits, which means zero out the last 14 chars (14*4 = 56), and bit-and the 15th last with b1000 == 8.
        hash = (hash.substring(0, 48) + (parseInt(hash[48], 16) & 8).toString(16)).padEnd(63, '0');
        // Remove leading zeroes.
        if (hash[0] === '0')
            hash = hash.replace(/^0+/, '');
        return '0x' + hash;
    }

    async assemble(owner: string, token_id_hint: string, briqs: { material: string; id?: string }[], uri: string) {
        const fungibles = {} as { [mat: string]: number };
        const nfts = [] as string[];
        for (const briq of briqs)
            if (briq.id)
                nfts.push(briq.id);
            else {
                if (!fungibles[briq.material])
                    fungibles[briq.material] = 0;
                ++fungibles[briq.material];
            }

        const fts = [];
        for (const ft in fungibles)
            fts.push([ft, '' + fungibles[ft]]);

        const split_uri = [] as string[];
        for (let i = 0; i < uri.length; i += 31) {
            const s = [];
            for (let c = i; c < Math.min(uri.length, i + 31); ++c) {
                const code = uri.charCodeAt(c);
                if (code > 255)
                    throw new Error('Only extended ASCII set is supported');
                s.push(code.toString(16));
            }
            split_uri.push('0x' + s.join(''));
        }

        return await this.contract.assemble_(owner, token_id_hint, fts, nfts, split_uri);
    }

    async disassemble(owner: string, token_id: string, set: SetData) {
        const fungibles = {} as { [mat: string]: number };
        const nfts = [] as string[];
        set.forEach((briq, _) => {
            if (briq.id)
                nfts.push(briq.id);
            else {
                if (!fungibles[briq.material])
                    fungibles[briq.material] = 0;
                ++fungibles[briq.material];
            }
        });
        const fts = [];
        for (const ft in fungibles)
            fts.push([ft, '' + fungibles[ft]]);

        return await this.contract.disassemble_(owner, token_id, fts, nfts);
    }

    async transferOneNFT(sender: string, recipient: string, token_id: string) {
        return await this.contract.transferFrom_(sender, recipient, token_id);
    }
}
