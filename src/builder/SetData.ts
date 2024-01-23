import { Briq } from './Briq';
import type { ChainBriqs } from './ChainBriqs';
import { markRaw } from 'vue';

import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

/**
 * Because of how indices are computed for the 3D->1D bijection, we can support set sizes up to Region_Size^2
 * However we have an upper limit because of the Javascript max int, of about 2^53-1.
 * This works for values up to 10^5, which end up being 8*10^5^3, which is slightly under 2^53.
 * (NB: the actual limit is slightly higher but I don't think we care at this point.)
 */
const REGION_SIZE = 100000;

const SET_DATA_VERSION = 1;
export class SetData {
    id: string;
    name: string;
    description: string;

    regionSize: number;
    // Indexed by region & cell
    briqs!: Map<number, Map<number, Briq>>;

    usedByMaterial!: { [key: string]: number };

    // Region/Cell ID of each briq, by ID
    // briqPos: Map<string, [number, number]>;

    briqs_!: number;
    usedByMaterial_!: number;

    constructor(id: string) {
        this.id = id;
        this.name = '';
        this.description = 'A set made of briqs';

        this.regionSize = REGION_SIZE;
        this.reset();
    }

    reset() {
        // For performance reasons, the maps are not reactive.
        // However, setData increments briqs_/usedByMaterial_ when those change, so you can react to that.
        this.briqs = markRaw(new Map());
        this.briqs_ = 0;
        this.usedByMaterial = markRaw({});
        this.usedByMaterial_ = 0;
    }

    serialize() {
        const ret: any = {};
        ret.id = this.id;
        ret.name = this.name;
        ret.description = this.description;
        ret.regionSize = this.regionSize;
        ret.version = SET_DATA_VERSION;

        ret.briqs = [];
        this.briqs.forEach((region, regionId) => {
            region.forEach((cell, cellPos) => {
                const data = {
                    pos: this.to3DPos(regionId, cellPos),
                    data: cell.serialize(),
                };
                ret.briqs.push(data);
            });
        });
        // Reactivity
        this.briqs_;
        this.usedByMaterial_;

        return ret;
    }

    deserialize(data: any): SetData {
        if (data.id && this.id !== data.id)
            throw new Error('Set tried to load data from the wrong set');
        this.reset();
        this.name = data.name;
        this.description = data?.description || '';
        this.regionSize = data.regionSize || REGION_SIZE;
        const version = +data.version;
        for (const briq of data.briqs) {
            const cell = new Briq();
            if (version === SET_DATA_VERSION)
                cell.deserialize(briq.data);
            else
                cell.deserializeV0(briq.data);
            this.placeBriq(briq.pos[0], briq.pos[1], briq.pos[2], cell);
        }
        return this;
    }

    ////////////////////////////////////////////////
    ////////////////////////////////////////////////

    getName() {
        return this.name || this.id;
    }

    forEach(callable: (cell: Briq, pos: [number, number, number]) => any) {
        this.briqs_;
        this.briqs.forEach((region, regionId) => {
            region.forEach((briq, cellPos) => {
                //let pos = this.to3DPos(regionId, cellPos);
                callable(briq, briq.position!);
            });
        });
    }

    getNbBriqs() {
        this.briqs_;
        let nb = 0;
        this.briqs.forEach((region, _) => (nb += region.size));
        return nb;
    }

    getAllBriqs() {
        this.briqs_;
        const ret = [] as Briq[];
        this.briqs.forEach((region, regionId) => {
            region.forEach((briq, _) => ret.push(briq));
        });
        return ret;
    }

    getAt(x: number, y: number, z: number): Briq | undefined {
        this.briqs_;
        const [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            return;
        return this.briqs.get(regionId)!.get(cellId);
    }

    _swapBriq(pos: [number, number, number], briq: Briq) {
        const [regionId, cellId] = this.computeIDs(...pos);
        const og = this.briqs.get(regionId)?.get(cellId);
        if (!og)
            throw new Error(`Could not find original briq at ${this.to3DPos(regionId, cellId)}`);
        this.briqs.get(regionId)?.set(cellId, briq);
        briq.position = pos;
        og.position = undefined;
        this.briqs_ += 1;
        dispatchBuilderAction('place_briq', { set: this.id, briq: briq.serialize(), position: pos });
        if (og.getMaterial() === briq.getMaterial())
            return;
        --this.usedByMaterial[og.getMaterial()];
        ++this.usedByMaterial[briq.getMaterial()];
        this.usedByMaterial_ += 1;
    }

    modifyBriq(x: number, y: number, z: number, data: any) {
        const cell = this.getAt(x, y, z);
        if (!cell)
            throw new Error(`No cell at position ${x}, ${y}, ${z}`);
        if (data.color)
            cell.color = data.color;
        if (data.material) {
            --this.usedByMaterial[cell.material];
            ++this.usedByMaterial[data.material];
            cell.material = data.material;
        }
        this.briqs_ += 1;
        dispatchBuilderAction('remove_briq', { set: this.id, position: [x, y, z] });
        dispatchBuilderAction('place_briq', { set: this.id, briq: cell.serialize(), position: [x, y, z] });
    }

    placeBriq(x: number, y: number, z: number, briq?: Briq): boolean {
        if (briq)
            return this.doPlaceBriq(x, y, z, briq);
        else
            return this.doRemoveBriq(x, y, z);
    }

    doPlaceBriq(x: number, y: number, z: number, briq: Briq): boolean {
        const [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            this.briqs.set(regionId, new Map());
        else if (this.briqs.get(regionId)?.get(cellId))
            this.doRemoveBriq(x, y, z);

        this.briqs.get(regionId)!.set(cellId, briq);
        briq.position = [x, y, z];

        if (!this.usedByMaterial[briq.material])
            this.usedByMaterial[briq.material] = 0;
        ++this.usedByMaterial[briq.material];

        this.briqs_ += 1;
        this.usedByMaterial_ += 1;

        dispatchBuilderAction('place_briq', { set: this.id, briq: briq.serialize(), position: [x, y, z] });

        return true;
    }

    doRemoveBriq(x: number, y: number, z: number): boolean {
        const [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            return true;
        const briq = this.briqs.get(regionId)!.get(cellId);
        if (!briq)
            return true;

        if (briq.material)
            --this.usedByMaterial[briq.material];

        this.briqs.get(regionId)!.delete(cellId);
        briq.position = undefined;

        this.briqs_ += 1;
        this.usedByMaterial_ += 1;

        dispatchBuilderAction('remove_briq', { set: this.id, position: [x, y, z], briq: { id: briq.id } });

        return true;
    }

    moveBriqs(x: number, y: number, z: number, briqs: Briq[]) {
        // Not the best algo I think but it's OK.
        this.forEach((briq, pos) => {
            briq._ex_pos = briq.position!.slice();
        });
        briqs.forEach((briq) => {
            briq.position![0] += x;
            briq.position![1] += y;
            briq.position![2] += z;
        });
        const ret = new Map();
        this.forEach((briq) => {
            const [regionId, cellId] = this.computeIDs(briq.position[0], briq.position[1], briq.position[2]);
            if (!ret.has(regionId))
                ret.set(regionId, new Map());
            if (ret.get(regionId).get(cellId)) {
                this.forEach((briq, pos) => {
                    briq.position = briq._ex_pos;
                });
                this.briqs_ += 1;
                throw new Error('briq already placed on cell');
            }
            ret.get(regionId).set(cellId, briq);
        });
        this.briqs = markRaw(ret);
        this.briqs_ += 1;
    }

    computeRegionId(x: number, y: number, z: number) {
        return (
            Math.floor(x / this.regionSize) +
            Math.floor(y / this.regionSize) * this.regionSize +
            Math.floor(z / this.regionSize) * this.regionSize * this.regionSize
        );
    }

    computeIDs(x: number, y: number, z: number): [number, number] {
        const rx: number = Math.floor(x / this.regionSize);
        const ry: number = Math.floor(y / this.regionSize);
        const rz: number = Math.floor(z / this.regionSize);

        const cx: number = x - rx * this.regionSize;
        const cy: number = y - ry * this.regionSize;
        const cz: number = z - rz * this.regionSize;

        const mapN = (val: number) => Math.abs(val) * 2 + +(val < 0);

        return [
            mapN(rx) + mapN(ry) * (this.regionSize * 2) + mapN(rz) * (this.regionSize * this.regionSize * 4),
            cx + cy * this.regionSize + cz * this.regionSize * this.regionSize,
        ];
    }

    to3DPos(regionId: number, cellId: number): [number, number, number] {
        let mz = Math.floor(regionId / this.regionSize / this.regionSize / 4);
        let my = Math.floor((regionId - mz * this.regionSize * this.regionSize * 4) / this.regionSize / 2);
        let mx = regionId - mz * this.regionSize * this.regionSize * 4 - my * this.regionSize * 2;

        const unmapN = (val: number) => {
            if (val % 2 == 1)
                val = (val - 1) * -1;
            return val / 2;
        };
        mz = unmapN(mz);
        my = unmapN(my);
        mx = unmapN(mx);

        const cz = Math.floor(cellId / this.regionSize / this.regionSize);
        const cy = Math.floor((cellId - cz * this.regionSize * this.regionSize) / this.regionSize);
        const cx = cellId - cz * this.regionSize * this.regionSize - cy * this.regionSize;
        return [mx * this.regionSize + cx, my * this.regionSize + cy, mz * this.regionSize + cz];
    }

    swapForRealBriqs(chainBriqs: ChainBriqs) {
        const usageByMaterial = {} as { [material: string]: { ft_balance: number; nft_ids: string[] } };
        const positions = [] as any[];
        this.forEach((cell, pos) => {
            if (!usageByMaterial[cell.material])
                usageByMaterial[cell.material] = { ft_balance: 0, nft_ids: [] };
            if (cell.id)
                usageByMaterial[cell.material].nft_ids.push(cell.id);
            else
                ++usageByMaterial[cell.material].ft_balance;
            positions.push(pos);
        });
        const swaps = chainBriqs.findRealBriqs(usageByMaterial);
        for (let i = 0; i < swaps.length; ++i) {
            const nft = swaps[i];
            this._swapBriq(positions[i], nft);
            if (!swaps.length)
                return;
        }
    }

    /*
    swapForFakeBriqs()
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqsDB.get(cellId)!;
                if (!cell.onChain)
                    return;
                let newBriq = this.briqsDB.getOrCreate(undefined);
                newBriq.material = cell.material;
                newBriq.color = cell.color;
                newBriq.set = this.id;
                region.set(cellPos, newBriq.id);
                this.briqsDB.briqs.delete(cell.id);
            });
        });
    }
    */
}
