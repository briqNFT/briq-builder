import { json } from "starknet";
import { reactive } from "vue";

function pseudoGUID()
{
    return Date.now() + Math.floor(Math.random()*100000);
}

export class Briq
{
    id: number;
    material: number;
    set: number;
    onChain: boolean;

    color: string;

    constructor(id: number, material: number, set: number)
    {
        this.id = id;
        this.material = material;
        this.set = set;
        this.onChain = false;
        this.color = "#000000";
    }

    serialize()
    {
        let ret: any = {
            material: this.material,
            set: this.set,
            color: this.color
        }
        if (this.onChain)
            ret.briq = this.id;
        return ret;
    }

    deserialize(data: any)
    {
        if (data.briq)
        {
            this.id = data.briq;
            this.onChain = true;
        }
        else
            this.id = pseudoGUID()
        this.material = data.material
        this.set = data.set;
        this.color = data.color;
        return this;
    }
}

export class BriqsDB
{
    briqs: Map<number, Briq>
    chainDb?: BriqsDB
    constructor(chainDb?: BriqsDB)
    {
        this.briqs = new Map();
        this.chainDb = chainDb;
    }

    deserializeBriq(data: any): Briq
    {
        let cell = new Briq(0, 0, 0).deserialize(data)
        this.briqs.set(cell.id, cell);
        return cell;
    }

    parseChainData(jsonResponse: string[])
    {
        for (let i = 0; i < jsonResponse.length / 3; ++i)
        {
            let briq = new Briq(parseInt(jsonResponse[i*3 + 0], 16), parseInt(jsonResponse[i*3 + 1], 16), parseInt(jsonResponse[i*3 + 2], 16));
            briq.onChain = true;
            this.briqs.set(briq.id, briq);
        }
    }

    reset()
    {
        this.briqs = new Map();
    }
    
    get(id: number): Briq | undefined
    {
        return this.briqs.get(id);
    }

    /**
     * Create a local copy of an on-chain briq or create a new local briq.
     * @param id 
     * @returns 
     */
    getOrCreate(id: number | undefined): Briq
    {
        if (id)
        {
            let cell = this.get(id);
            if (cell)
                return cell;
            this.briqs.set(id, new Briq(id, 1, 0));
            return this.briqs.get(id)!;
        }
        return this.create(pseudoGUID(), 1, 0);
    }

    create(id: number, material: number, set: number): Briq
    {
        let briq = new Briq(id, material, set);
        this.briqs.set(briq.id, briq);
        return briq;
    }

    cloneBriq(id: number, from: BriqsDB): Briq
    {
        let br = from.get(id)!;
        let ret = new Briq(id, br.material, br.set);
        this.briqs.set(id, ret);
        return ret;
    }

    getAvailableBriq(material: number): number | undefined
    {
        for (let briq of this.briqs.values())
        {
            if (!briq.set && briq.material === material)
                return briq.id;
        }
        return undefined;
    }
}
