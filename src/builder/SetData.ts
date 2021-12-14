import { Briq, BriqsDB } from './BriqsDB'

import { BuilderDataEvent, builderDataEvents } from './BuilderDataEvents'

import { cellSize } from './Constants';


class SetDataEvent extends BuilderDataEvent
{
    constructor(setId: number)
    {
        super("setData");
        this.data = {
            "set": setId
        };
    }

    subtype(subtype: string): SetDataEvent
    {
        this.data.subtype = subtype;
        return this;
    }

    setData(newData: any): SetDataEvent
    {
        let setId = this.data.set;
        this.data = Object.assign(this.data, newData);
        this.data.set = setId;
        return this;
    }
}

export class SetData
{
    id: number;
    name: string;
    onChain: boolean;

    regionSize: number;
    // Indexed by region & cell
    briqs: Map<number, Map<number, number>>;

    usedByMaterial: { [key:string]: number };

    // This briqsDB is unique to the set.
    briqsDB: BriqsDB

    constructor(id: number, chainBriqsBd: BriqsDB)
    {
        this.id = id;
        this.name = "";
        this.onChain = false;

        this.regionSize = 10;
        this.briqs = new Map();
        this.usedByMaterial = {};

        this.briqsDB = new BriqsDB(chainBriqsBd);
    }

    serialize()
    {
        let ret: any = {};
        ret.id = this.id;
        ret.name = this.name;
        ret.regionSize = 10;
        ret.briqs = [];
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqsDB.get(cellId)!;
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
        if (data.id && this.id !== data.id)
            throw new Error("Set tried to load data from the wrong set");
        this.reset();
        this.name = data.name;
        this.regionSize = data.regionSize;
        for (let briq of data.briqs)
        {
            let cell = this.briqsDB.deserializeBriq(briq.data);
            this.placeBriq(briq.pos[0], briq.pos[1], briq.pos[2], cell.color, cell.material, cell.id);
        }
        return this;
    }

    reset()
    {
        this.briqs = new Map();
        this.usedByMaterial = {};
        this.briqsDB.reset();
        builderDataEvents.push(new SetDataEvent(this.id).subtype("reset"));
    }

    forEach(callable: (cell: Briq, pos: [number, number, number]) => any)
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqsDB.get(cellId);
                if (!cell)
                    throw new Error("Impossible");
                let pos = this.to3DPos(regionId, cellPos);
                callable(cell, pos);
            });
        });
    }

    getAt(x: number, y: number, z: number): Briq | undefined
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            return;
        let briqId = this.briqs.get(regionId)!.get(cellId);
        if (!briqId)
            return;
        return this.briqsDB.get(briqId);
    }

    placeBriq(x: number, y: number, z: number, color: string, cellKind: number, briq?: number): boolean
    {
        if (cellKind > 0)
            return this.doPlaceBriq(x, y, z, color, cellKind, briq);
        else
            return this.doRemoveBriq(x, y, z);
    }

    doPlaceBriq(x: number, y: number, z: number, color: string, cellKind: number, briq?: number): boolean
    {
        if (Math.abs(x) > cellSize || Math.abs(z) > cellSize)
            return false;
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            this.briqs.set(regionId, new Map());
        else if (!!this.briqs.get(regionId)?.get(cellId))
            return false;

        // TODO: plan is that you can place a specific briq from the real world, but I need to handle that better
        // In particular I need to handle trying to place the same briq in 2 different spots.
        let actualBriq = this.briqsDB.getOrCreate(briq);
        if (!actualBriq)
            return false;
        actualBriq.material = cellKind;
        actualBriq.color = color;
        actualBriq.set = this.id;
        
        this.briqs.get(regionId)!.set(cellId, actualBriq.id);

        if (!this.usedByMaterial[cellKind])
            this.usedByMaterial[cellKind] = 0;
        ++this.usedByMaterial[cellKind];

        builderDataEvents.push(new SetDataEvent(this.id).subtype("place").setData({
            x: x, y: y, z: z,
            kind: cellKind,
        }));
        return true;
    }

    doRemoveBriq(x: number, y: number, z: number): boolean
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId) || !this.briqs.get(regionId)!.get(cellId))
            return true;
        const material = this.briqsDB.get(this.briqs.get(regionId)!.get(cellId)!)?.material;
        
        if (material)
            --this.usedByMaterial[material];
        
        this.briqs.get(regionId)!.delete(cellId);
        this.briqsDB.briqs.delete(cellId);

        builderDataEvents.push(new SetDataEvent(this.id).subtype("place").setData({
            x: x, y: y, z: z,
            kind: 0,
        }));
        return true;
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

    swapForRealBriqs(chainDB: BriqsDB)
    {
        var available_by_matos: any = {
            "1": [],
            "2": [],
            "3": [],
            "4": [],
        };
        for (const brick of chainDB.briqs.values())
        {
            if (brick.set !== 0)
                continue;
            // Already used.
            if (this.briqsDB.get(brick.id))
                continue;
            available_by_matos[brick.material].push(brick.id);
        }
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqsDB.get(cellId)!;
                if (cell.onChain)
                    return;
                let newBriq = this.briqsDB.cloneBriq(available_by_matos[cell.material].splice(0, 1)[0], chainDB);
                // Copy color since that's not on-chain.
                newBriq.color = cell.color;
                newBriq.onChain = true;
                region.set(cellPos, newBriq.id);
            });
        });
    }

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
}
