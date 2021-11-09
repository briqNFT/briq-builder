class BuilderData
{
    cellData: Map<number, Uint16Array>;
    cellBriq: Map<number, Map<number, number>>;
    regionSize: number;
    constructor()
    {
        this.regionSize = 20;
        this.cellData = new Map();
        this.cellBriq = new Map();
    }

    placeBriq(x: number, y: number, z: number, cellKind: number, briq: number|undefined)
    {
        let [regionId, cellId] = this.#computeIDs(x, y, z);
        if (!this.cellData.has(regionId))
            this.cellData.set(regionId, new Uint16Array(this.regionSize * this.regionSize * this.regionSize));
        this.cellData.get(regionId)[cellId] = cellKind;
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
