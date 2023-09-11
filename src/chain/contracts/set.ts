import type { Provider, Signer } from 'starknet';
import type { SetData } from '../../builder/SetData';
import { Contract, FunctionAbi } from 'starknet';

import { hash as snHash } from 'starknet';

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
        let hash = snHash.computeHashOnElements([address, token_id_hint]);
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
        const two = starknet.number.toBN(2);
        let colorHex = '0x';
        const colorHexCode = briq.data.color.toLowerCase();
        for (let i = 0; i < colorHexCode.length; ++i)
            colorHex += colorHexCode.charCodeAt(i).toString(16).padStart(2, '0');
        const color_nft_material = starknet.number.toBN(briq.data.material).iadd(starknet.number.toBN(colorHex).imul(two.pow(starknet.number.toBN(136))))
        const x_y_z = (starknet.number.toBN(briq.pos[2]).add(two.pow(starknet.number.toBN(63)))).iadd(
            starknet.number.toBN(briq.pos[1]).add(two.pow(starknet.number.toBN(63))).mul(two.pow(starknet.number.toBN(64)))).iadd(
            starknet.number.toBN(briq.pos[0]).add(two.pow(starknet.number.toBN(63))).mul(two.pow(starknet.number.toBN(128))),
        )
        return [color_nft_material.toString(10), x_y_z.toString(10)]
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
        shapes.sort((a, b) => a[1].localeCompare(b[1], 'en'));
        const fts = [];
        for (const ft in fungibles)
            fts.push([ft, '' + fungibles[ft]]);

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

export class SetOnDojoContract {
    world_address: string;
    executor_address: string;
    constructor(_: string, __: Provider, addresses: typeof ADDRESSES['starknet-testnet-dojo']) {
        this.world_address = addresses.world;
        this.executor_address = addresses.executor;
    }

    connect(_: string, __: Provider, addresses: typeof ADDRESSES['starknet-testnet-dojo']) {
        this.world_address = addresses.world;
        this.executor_address = addresses.executor;
    }

    precomputeTokenId(address: string, token_id_hint: string, nb_briqs: number) {
        let hash = snHash.pedersen([0, address]);
        hash = snHash.pedersen([hash, token_id_hint]);
        hash = snHash.pedersen([hash, nb_briqs]);
        hash = (BigInt(hash) % BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00')).toString(16);
        return '0x' + hash;
    }

    _compress_shape_item(briq: any) {
        const two = starknet.number.toBN(2);
        let colorHex = '0x';
        const colorHexCode = briq.data.color.toLowerCase();
        for (let i = 0; i < colorHexCode.length; ++i)
            colorHex += colorHexCode.charCodeAt(i).toString(16).padStart(2, '0');
        const color_nft_material = starknet.number.toBN(briq.data.material).iadd(starknet.number.toBN(colorHex).imul(two.pow(starknet.number.toBN(136))))
        const x_y_z = (starknet.number.toBN(briq.pos[2]).add(two.pow(starknet.number.toBN(63)))).iadd(
            starknet.number.toBN(briq.pos[1]).add(two.pow(starknet.number.toBN(63))).mul(two.pow(starknet.number.toBN(64)))).iadd(
            starknet.number.toBN(briq.pos[0]).add(two.pow(starknet.number.toBN(63))).mul(two.pow(starknet.number.toBN(128))),
        )
        return [color_nft_material.toString(10), x_y_z.toString(10)]
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
        shapes.sort((a, b) => a[1].localeCompare(b[1], 'en'));
        const fts = [];
        for (const ft in fungibles)
            fts.push([ft, '' + fungibles[ft]]);

        const setName = this._string_to_felt_string(data.name);
        const setDescription = this._string_to_felt_string(data.description);
        return { setName, setDescription, fts, nfts, shapes };
    }

    prepareAssemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        const { setName, setDescription, fts, nfts, shapes } = this._prepareForAssemble(owner, token_id_hint, data, booklet);
        //return this.contract.populate('assemble_', [owner, token_id_hint, setName, setDescription, fts, nfts, shapes, booklet ? [booklet] : []]);
        const ret = {
            contractAddress: this.world_address,
            entrypoint: 'execute',
            calldata: [
                starknet.shortString.encodeShortString('set_nft_assembly'), 0,
                owner, // caller
                owner, token_id_hint,
                setName.length, ...setName,
                setDescription.length, ...setDescription,
                fts.length, ...fts.flat(),
                shapes.length, ...shapes.flat(),
                ...(booklet ? [1, booklet] : [0]),
            ],
        };
        ret.calldata[1] = ret.calldata.length - 2;
        return ret;
    }

    async assemble(owner: string, token_id_hint: string, data: any, booklet?: string) {
        await maybeStore.value!.ensureEnabled();
        return toRaw(await (maybeStore.value!.signer as starknet.AccountInterface).execute(this.prepareAssemble(owner, token_id_hint, data, booklet)));
        //return toRaw(await this.contract.assemble_(owner, token_id_hint, setName, setDescription, fts, nfts, shapes, booklet ? [booklet] : []));
    }

    async callAndAssemble(otherCalls: Array<starknet.Call>, owner: string, token_id_hint: string, data: any, booklet?: string) {
        await maybeStore.value!.ensureEnabled();
        const calls = toRaw(otherCalls).concat([this.prepareAssemble(owner, token_id_hint, data, booklet)]);
        return await (maybeStore.value!.signer as starknet.AccountInterface).execute(calls);
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

        const tx = {
            contractAddress: this.world_address,
            entrypoint: 'execute',
            calldata: [
                starknet.shortString.encodeShortString('set_nft_disassembly'), 0,
                owner, // caller
                owner, token_id,
                fts.length, ...fts.flat(),
                ...(booklet ? [1, booklet] : [0]),
            ],
        };
        tx.calldata[1] = tx.calldata.length - 2;
        console.log(tx);
        return toRaw(await (maybeStore.value!.signer as starknet.AccountInterface).execute(tx));
    }

    async transferOneNFT(sender: string, recipient: string, token_id: string) {
        throw new Error('Not implemented');
        //await maybeStore.value!.ensureEnabled();
        //return await this.contract.transferFrom_(sender, recipient, token_id);
    }
}
