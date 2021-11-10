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

    constructor(id: number, material: number, set: number)
    {
        this.id = id;
        this.material = material;
        this.set = set;
        this.onChain = false;
    }

    serialize()
    {
        if (this.onChain)
        {
            return {
                briq: this.id
            }
        }
        else
        {
            return {
                material: this.material,
                set: this.set
            }
        }
    }

    setOnChain(value: boolean): Briq
    {
        this.onChain = value;
        return this;
    }
}

export class BriqsData
{
    briqs: Map<number, Briq>
    constructor()
    {
        this.briqs = new Map();
    }

    deserializeBriq(data: any): Briq
    {
        if (data.briq)
        {
            return this.get(data.briq);
        }
        else
            return this.create(pseudoGUID(), data.material, data.set)
    }

    get(id: number): Briq
    {
        let briq = this.briqs.get(id);
        if (!briq)
            throw new Error("Get() has not found briq ID" + id);
        return briq;
    }

    getOrCreate(id: number | undefined, material?: number, set?: number): Briq
    {
        if (id)
        {
            let cell = this.get(id);
            if (cell)
                return cell;
        }
        return this.create(pseudoGUID(), material, set);
    }

    create(id: number, material: number, set: number): Briq
    {
        let briq = new Briq(id, material, set);
        this.briqs.set(briq.id, briq);
        return briq;
    }
}
