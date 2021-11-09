class BuilderDataEvent
{
    type: string;
    data: any;
    constructor(type: string, data)
    {
        this.type = type;
        this.data = data;
    }
}

export var builderDataEvents: Array<BuilderDataEvent> = [];

class BuilderData
{
    cellData: Map<number, Uint16Array>;
    cellBriq: Map<number, Map<number, number>>;
    regionSize: number;
    constructor()
    {
        this.regionSize = 10;
        this.cellData = new Map();
        this.cellBriq = new Map();
    }

    placeBriq(x: number, y: number, z: number, cellKind: number, briq?: number): boolean
    {
        if (cellKind > 0)
            return this.#doPlaceBriq(x, y, z, cellKind, briq);
        else
            return this.#doRemoveBriq(x, y, z);
    }

    #doPlaceBriq(x: number, y: number, z: number, cellKind: number, briq?: number): boolean
    {
        let [regionId, cellId] = this.#computeIDs(x, y, z);
        if (!this.cellData.has(regionId))
            this.cellData.set(regionId, new Uint16Array(this.regionSize * this.regionSize * this.regionSize));
        else if (this.cellData.get(regionId)[cellId] !== 0)
            return false;
        this.cellData.get(regionId)[cellId] = cellKind;
        builderDataEvents.push(new BuilderDataEvent("place", {
            x: x, y: y, z: z,
            kind: cellKind,
        }));
        return true;
    }

    #doRemoveBriq(x: number, y: number, z: number): boolean
    {
        let [regionId, cellId] = this.#computeIDs(x, y, z);
        if (!this.cellData.has(regionId))
            return true;
        this.cellData.get(regionId)[cellId] = 0;
        builderDataEvents.push(new BuilderDataEvent("place", {
            x: x, y: y, z: z,
            kind: 0,
        }));
        return true;
    }

    #computeRegionId(x: number, y: number, z: number)
    {
        return Math.floor(x / this.regionSize) + (Math.floor(y / this.regionSize) * this.regionSize) + (Math.floor(z / this.regionSize) * this.regionSize * this.regionSize);
    }

    #computeIDs(x: number, y: number, z: number): [number, number]
    {
        let rx: number = Math.floor(x / this.regionSize);
        let ry: number = Math.floor(y / this.regionSize);
        let rz: number = Math.floor(z / this.regionSize);
        return [
          rx + ry * this.regionSize + rz * this.regionSize * this.regionSize,
          (x - rx) + (y - ry) * this.regionSize + (z - rz) * this.regionSize * this.regionSize
        ];
    }
}

export var builderData = new BuilderData();
