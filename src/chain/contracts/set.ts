import type { Provider, Signer } from 'starknet';
import type { SetData } from '../../builder/SetData';
import { Contract, FunctionAbi } from 'starknet';

import SetABI from './starknet-testnet/set_nft.json';
import * as starknet from 'starknet';
import { maybeStore } from '../WalletLoading';
import { toRaw } from 'vue';
import type { ADDRESSES } from '../Contracts';

const SHAPE_HASH_COLLECTION = 2;

export default class SetContract {
    contract!: Contract;
    constructor(address: string, provider: Provider) {
        this.connect(address, provider);
    }

    connect(address: string, provider: Provider) {
        this.contract = new Contract(SetABI as FunctionAbi[], address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    // TODO: add URI
    precomputeTokenId(address: string, token_id_hint: string) {
        let hash = starknet.hash.computeHashOnElements([address, token_id_hint]);
        hash = hash.substring(2).padStart(63, '0');
        // Hash is 0x prefixed string. JS numbers are not big enough to parse this, and I'm lazy.
        // We need to 0 out the last 59 bits, which means zero out the last 14 chars (14*4 = 56), and bit-and the 15th last with b1000 == 8.
        hash = (hash.substring(0, 48) + (parseInt(hash[48], 16) & 8).toString(16)).padEnd(63, '0');
        // Remove leading zeroes.
        if (hash[0] === '0')
            hash = hash.replace(/^0+/, '');
        return '0x' + hash;
    }

    _compress_shape_item(briq: any) {
        let colorHex = '0x';
        const colorHexCode = briq.data.color.toLowerCase();
        for (let i = 0; i < colorHexCode.length; ++i)
            colorHex += colorHexCode.charCodeAt(i).toString(16).padStart(2, '0');
        const color_material = BigInt(briq.data.material) + BigInt(colorHex) * 2n ** 64n;
        const x_y_z = BigInt(briq.pos[2]) + 2n ** 31n +
            (BigInt(briq.pos[1]) + 2n ** 31n) * 2n ** 32n +
            (BigInt(briq.pos[0]) + 2n ** 31n) * 2n ** 64n;
        return starknet.cairo.tuple(color_material.toString(10), x_y_z.toString(10));
    }

    _string_to_felt_string(data: string) {
        const encoded = new TextEncoder().encode(data);
        const out = ['0x'];
        encoded.forEach(x => {
            if (out[out.length - 1].length >= 32)
                out.push('0x');
            out[out.length - 1] += x.toString(16).padStart(2, '0');
        });
        if (out[out.length - 1] === '0x')
            out.pop();
        return out;
    }

    _prepareForAssemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const fungibles = {} as { [mat: string]: number };
        const nfts = [] as string[];
        const shapes = [];
        for (const briq of data.briqs) {
            shapes.push(this._compress_shape_item(briq));
            if (briq.data.id)
                nfts.push(briq.data.id);
            else {
                if (!fungibles[briq.data.material])
                    fungibles[briq.data.material] = 0;
                ++fungibles[briq.data.material];
            }
        }
        shapes.sort((a, b) => a.x_y_z.localeCompare(b.x_y_z, 'en'));
        const fts = [];
        for (const ft in fungibles)
            fts.push({ token_id: ft, qty: '' + fungibles[ft] });

        const setName = this._string_to_felt_string(data.name);
        const setDescription = this._string_to_felt_string(data.description);
        return { setName, setDescription, fts, nfts, shapes };
    }

    async assemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const { setName, setDescription, fts, nfts, shapes } = this._prepareForAssemble(owner, token_id_hint, data, booklet);
        await maybeStore.value!.ensureEnabled();
        return toRaw(await this.contract.assemble_(owner, token_id_hint, setName, setDescription, fts, nfts, shapes, booklet ? [booklet] : []));
    }

    async callAndAssemble(otherCalls: Array<starknet.Call>, owner: string, token_id_hint: string, data: any, booklet?: string) {
        await maybeStore.value!.ensureEnabled();
        const calls = toRaw(otherCalls).concat([this.prepareAssemble(owner, token_id_hint, data, booklet)]);
        return await (this.contract.providerOrAccount as starknet.AccountInterface).execute(calls);
    }

    prepareAssemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const { setName, setDescription, fts, nfts, shapes } = this._prepareForAssemble(owner, token_id_hint, data, booklet);
        return this.contract.populate('assemble_', [owner, token_id_hint, setName, setDescription, fts, nfts, shapes, booklet ? [booklet] : []]);
    }

    async disassemble(owner: string, token_id: string, set: SetData, booklet?: string) {
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

        await maybeStore.value!.ensureEnabled();
        return await this.contract.disassemble_(owner, token_id, fts, nfts, booklet ? [booklet] : []);
    }

    async transferOneNFT(sender: string, recipient: string, token_id: string) {
        await maybeStore.value!.ensureEnabled();
        return await this.contract.transferFrom_(sender, recipient, token_id);
    }
}

export class SetOnDojoContract extends SetContract {
    precomputeTokenId(address: string, token_id_hint: string, nb_briqs: number, booklet?: string) {
        let hash = starknet.ec.starkCurve.pedersen(0, address);
        hash = starknet.ec.starkCurve.pedersen(hash, token_id_hint);
        hash = starknet.ec.starkCurve.pedersen(hash, nb_briqs);
        hash = (
            BigInt(hash) % BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00') & BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000')
        ).toString(16);
        return '0x' + hash;
    }

    _compress_shape_item(briq: any) {
        let colorHex = '0x';
        const colorHexCode = briq.data.color.toLowerCase();
        for (let i = 0; i < colorHexCode.length; ++i)
            colorHex += colorHexCode.charCodeAt(i).toString(16).padStart(2, '0');
        const color_material = BigInt(briq.data.material) + BigInt(colorHex) * 2n ** 64n;
        const x_y_z = BigInt(briq.pos[2]) + 2n ** 31n +
            (BigInt(briq.pos[1]) + 2n ** 31n) * 2n ** 32n +
            (BigInt(briq.pos[0]) + 2n ** 31n) * 2n ** 64n;
        return { color_nft_material: color_material.toString(10), x_y_z: x_y_z.toString(10) };
    }

    async assemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const { setName, setDescription, fts, nfts, shapes } = this._prepareForAssemble(owner, token_id_hint, data, booklet);
        await maybeStore.value!.ensureEnabled();
        return toRaw(await this.contract.assemble(owner, token_id_hint, setName, setDescription, fts, shapes, booklet ? [booklet] : []));
    }
    prepareAssemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const { setName, setDescription, fts, nfts, shapes } = this._prepareForAssemble(owner, token_id_hint, data, booklet);
        this.contract.assemble(owner, token_id_hint, setName, setDescription, fts, shapes, booklet ? [booklet] : []);
        return this.contract.populate('assemble', [owner, token_id_hint, setName, setDescription, fts, shapes, booklet ? [booklet] : []]);
    }


    async disassemble(owner: string, token_id: string, set: SetData, booklet?: string) {
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

        await maybeStore.value!.ensureEnabled();
        return await this.contract.disassemble(owner, token_id, fts, booklet ? [booklet] : []);
    }

}
