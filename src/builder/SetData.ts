import { Briq, BriqsData } from './BriqsData'

import { BuilderDataEvent, builderDataEvents } from './BuilderDataEvents'

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

    usedByMaterial: object;

    briqDB: BriqsData

    constructor(id: number, briqDB: BriqsData)
    {
        this.id = id;
        this.name = "";
        this.onChain = false;

        this.regionSize = 10;
        this.briqs = new Map();
        this.usedByMaterial = {};

        this.briqDB = briqDB;
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
                let cell = this.briqDB.get(cellId);
                let data = {
                    pos: this.to3DPos(regionId, cellPos),
                    data: cell.serialize()
                }
                ret.briqs.push(data);
            });
        });
        return ret;
    }

    deserialize(data): SetData
    {
        if (this.id !== data.id)
            throw new Error("Set tried to load data from the wrong set");
        this.reset();
        this.name = data.name;
        this.regionSize = data.regionSize;
        for (let briq of data.briqs)
        {
            let cell = this.briqDB.deserializeBriq(briq.data);
            this.placeBriq(briq.pos[0], briq.pos[1], briq.pos[2], cell.material, cell.id);
        }
        return this;
    }

    reset()
    {
        this.briqs = new Map();
        this.usedByMaterial = {};
        builderDataEvents.push(new SetDataEvent(this.id).subtype("reset"));
    }

    forEach(callable: (cell: Briq, pos: [number, number, number]) => any)
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqDB.get(cellId);
                if (!cell)
                    throw new Error("Impossible");
                let pos = this.to3DPos(regionId, cellPos);
                callable(cell, pos);
            });
        });
    }

    placeBriq(x: number, y: number, z: number, cellKind: number, briq?: number): boolean
    {
        if (cellKind > 0)
            return this.doPlaceBriq(x, y, z, cellKind, briq);
        else
            return this.doRemoveBriq(x, y, z);
    }

    doPlaceBriq(x: number, y: number, z: number, cellKind: number, briq?: number): boolean
    {
        let [regionId, cellId] = this.computeIDs(x, y, z);
        if (!this.briqs.has(regionId))
            this.briqs.set(regionId, new Map());
        else if (!!this.briqs.get(regionId)?.get(cellId))
            return false;

        let actualBriq = this.briqDB.getOrCreate(briq, cellKind, this.id);
        if (!actualBriq)
            return false;
        
        this.briqs.get(regionId).set(cellId, actualBriq.id);

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
        if (!this.briqs.has(regionId) || !this.briqs.get(regionId).get(cellId))
            return true;
        const material = this.briqDB.get(this.briqs.get(regionId).get(cellId))?.material;
        
        if (material)
            --this.usedByMaterial[material];
        
        this.briqs.get(regionId).delete(cellId);

        builderDataEvents.push(new SetDataEvent(this.id).subtype("place").setData({
            x: x, y: y, z: z,
            kind: 0,
        }));
        return true;
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
        return [
          rx + ry * this.regionSize + rz * this.regionSize * this.regionSize,
          (x - rx * this.regionSize) + (y - ry * this.regionSize) * this.regionSize + (z - rz * this.regionSize) * this.regionSize * this.regionSize
        ];
    }

    to3DPos(regionId: number, cellId: number): [number, number, number]
    {
        let mz = Math.floor(regionId / this.regionSize / this.regionSize);
        let my = Math.floor((regionId - mz * this.regionSize * this.regionSize) / this.regionSize);
        let mx = regionId - mz * this.regionSize * this.regionSize - my * this.regionSize;
        let cz = Math.floor(cellId / this.regionSize / this.regionSize);
        let cy = Math.floor((cellId - cz * this.regionSize * this.regionSize) / this.regionSize);
        let cx = cellId - cz * this.regionSize * this.regionSize - cy * this.regionSize;
        return [
            mx * this.regionSize + cx,
            my * this.regionSize + cy,
            mz * this.regionSize + cz,
        ];
    }

    swapForRealBriqs(available_by_matos: any)
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqDB.get(cellId);
                if (!cell)
                    throw new Error("Impossible");
                if (cell.onChain)
                    return;
                let newBriq = this.briqDB.get(parseInt(available_by_matos[cell.material].splice(0, 1)[0], 16));
                region.set(cellPos, newBriq.id);
            });
        });
    }

    swapForFakeBriqs()
    {
        this.briqs.forEach((region, regionId) => {
            region.forEach((cellId, cellPos) => {
                let cell = this.briqDB.get(cellId);
                if (!cell)
                    throw new Error("Impossible");
                if (!cell.onChain)
                    return;
                let newBriq = this.briqDB.getOrCreate(undefined, cell.material, this.id);
                region.set(cellPos, newBriq.id);
            });
        });
    }
}
