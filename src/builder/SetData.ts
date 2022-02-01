import { number } from 'starknet';
import { Briq } from './Briq';
import type { ChainBriqs } from './ChainBriqs';

import { computeHashOnElements } from 'starknet/utils/hash';

const SET_DATA_VERSION = 1;

export class SetData
{
    id: string;
    name: string;

    regionSize: number;
    // Indexed by region & cell
    briqs: Map<number, Map<number, Briq>>;

    usedByMaterial: { [key:string]: number };

    // Region/Cell ID of each briq, by ID
    // briqPos: Map<string, [number, number]>;

    constructor(id: string)
    {
        this.id = id;
        this.name = "";

        this.regionSize = 10;
        this.briqs = new Map();
        this.usedByMaterial = {};
    }

    reset()
    {
        this.briqs = new Map();
        this.usedByMaterial = {};
    }

    serialize()
    {
        let ret: any = {};
        ret.id = this.id;
        ret.name = this.name;
        ret.regionSize = 10;
        ret.version = SET_DATA_VERSION;
        ret.briqs = [];
        this.briqs.forEach((region, regionId) => {
            region.forEach((cell, cellPos) => {
                let data = {
                    pos: this.to3DPos(regionId, cellPos),
                    data: cell.serialize()
                }
                ret.briqs.push(data);
            });
        });
        return ret;
    }

    deserialize(data: any): SetData
    {
        // TEMP CODE
        if (data.chainId)
            data.id = data.chainId;

        if (data.id && this.id !== data.id)
            throw new Error("Set tried to load data from the wrong set");
        this.reset();
        this.name = data.name;
        this.regionSize = data.regionSize;
        let version = data.version;
        for (let briq of data.briqs)
        {
            let cell = new Briq();
            if (version === SET_DATA_VERSION)
                cell.deserialize(briq.data);
            else
                cell.deserializeV0(briq.data);
            this.placeBriq(briq.pos[0], briq.pos[1], briq.pos[2], cell);
        }
        return this;
    }
    
    getName() {
        return this.name || this.id;
    }

    ////////////////////////////////////////////////
    ////////////////////////////////////////////////

    forEach(callable: (cell: Briq, pos: [number, number, number]) => any)
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((briq, cellPos) => {
                let pos = this.to3DPos(regionId, cellPos);
                callable(briq, pos);
            });
        });
    }

    getNbBriqs()
    {
        let nb = 0;
        this.briqs.forEach((region, _) => nb += region.size);
        return nb;
    }

    getAllBriqs()
    {
        let ret = [] as Briq[];
        this.briqs.forEach((region, regionId) => {
            region.forEach((briq, _) => ret.push(briq));
        });
        return ret;
    }

    getAt(x: number, y: number, z: number): Briq | undefined
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            return;
        return this.briqs.get(regionId)!.get(cellId);
    }

    _swapBriq(pos: [number, number, number], briq: Briq)
    {
        let [regionId, cellId] = this.computeIDs(...pos);
        let og = this.briqs.get(regionId)?.get(cellId);
        if (!og)
            throw new Error(`Could not find original briq at ${this.to3DPos(regionId, cellId)}`);
        this.briqs.get(regionId)?.set(cellId, briq);
        if (og.getMaterial() === briq.getMaterial())
            return;
        --this.usedByMaterial[og.getMaterial()];
        ++this.usedByMaterial[briq.getMaterial()];
    }

    modifyBriq(x: number, y: number, z: number, data: any): Briq
    {
        let cell = this.getAt(x, y, z);
        if (!cell)
            throw new Error(`No cell at position ${x}, ${y}, ${z}`);
        if (data.color)
        {
            cell.color = data.color;
        }
        return cell;
    }

    placeBriq(x: number, y: number, z: number, briq?: Briq): boolean
    {
        if (briq)
            return this.doPlaceBriq(x, y, z, briq);
        else
            return this.doRemoveBriq(x, y, z);
    }

    doPlaceBriq(x: number, y: number, z: number, briq: Briq): boolean
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            this.briqs.set(regionId, new Map());
        else if (!!this.briqs.get(regionId)?.get(cellId))
            return false;

        this.briqs.get(regionId)!.set(cellId, briq);
        //this.briqPos.set(actualBriq.id, [regionId, cellId]);

        if (!this.usedByMaterial[briq.material])
            this.usedByMaterial[briq.material] = 0;
        ++this.usedByMaterial[briq.material];

        return true;
    }

    doRemoveBriq(x: number, y: number, z: number): boolean
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            return true;
        let briq = this.briqs.get(regionId)!.get(cellId);
        if (!briq)
            return true;

        if (briq.material)
            --this.usedByMaterial[briq.material];
        
        this.briqs.get(regionId)!.delete(cellId);
        //this.briqPos.delete(briq.id);

        return true;
    }

    moveAll(x: number, y: number, z: number)
    {
        let ret = new Map();
        this.forEach((briq, pos) => {
            let [regionId, cellId] = this.computeIDs(pos[0] + x, pos[1] + y, pos[2] + z);
            if (!ret.has(regionId))
                ret.set(regionId, new Map());
            ret.get(regionId).set(cellId, briq);
        })
        this.briqs = ret;
    }

    computeRegionId(x: number, y: number, z: number)
    {
        return Math.floor(x / this.regionSize) + (Math.floor(y / this.regionSize) * this.regionSize) + (Math.floor(z / this.regionSize) * this.regionSize * this.regionSize);
    }

    computeIDs(x: number, y: number, z: number): [number, number]
    {
        let rx: number = Math.floor(x / this.regionSize);
        let ry: number = Math.floor(y / this.regionSize);
        let rz: number = Math.floor(z / this.regionSize);

        let cx: number = (x - rx * this.regionSize);
        let cy: number = (y - ry * this.regionSize);
        let cz: number = (z - rz * this.regionSize);

        let mapN = (val: number) => Math.abs(val) * 2 + +(val < 0);

        return [
            mapN(rx) + mapN(ry) * (this.regionSize * 2) + mapN(rz) * (this.regionSize * this.regionSize * 4),
            cx + cy * this.regionSize + cz * this.regionSize * this.regionSize,
        ];
    }

    to3DPos(regionId: number, cellId: number): [number, number, number]
    {
        let mz = Math.floor(regionId / this.regionSize / this.regionSize / 4);
        let my = Math.floor((regionId - mz * this.regionSize * this.regionSize * 4) / this.regionSize / 2);
        let mx = regionId - mz * this.regionSize * this.regionSize * 4 - my * this.regionSize * 2;

        let unmapN = (val: number) => {
            if (val % 2 == 1)
                val = (val - 1) * -1;
            return val / 2;
        }
        mz = unmapN(mz);
        my = unmapN(my);
        mx = unmapN(mx);

        let cz = Math.floor(cellId / this.regionSize / this.regionSize);
        let cy = Math.floor((cellId - cz * this.regionSize * this.regionSize) / this.regionSize);
        let cx = cellId - cz * this.regionSize * this.regionSize - cy * this.regionSize;
        return [
            mx * this.regionSize + cx,
            my * this.regionSize + cy,
            mz * this.regionSize + cz,
        ];
    }

    swapForRealBriqs(chainBriqs: ChainBriqs)
    {
        let usageByMaterial = {} as { [material: string]: { ft_balance: number, nft_ids: string[] } };
        let positions = [] as any[];
        this.forEach((cell, pos) => {
            if (!usageByMaterial[cell.material])
                usageByMaterial[cell.material] = { ft_balance: 0, nft_ids: [] };
            if (cell.id)
                usageByMaterial[cell.material].nft_ids.push(cell.id);
            else
                ++usageByMaterial[cell.material].ft_balance;
            positions.push(pos);
        })
        let swaps = chainBriqs.findRealBriqs(usageByMaterial);
        for (let i = 0; i < swaps.length; ++i)
        {
            let nft = swaps[i];
            this._swapBriq(positions[i], nft);
            if (!swaps.length)
                return;
        };
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
