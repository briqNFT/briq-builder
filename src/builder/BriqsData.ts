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

    constructor(material: number, set: number, id?: number)
    {
        this.id = pseudoGUID();
        this.material = material;
        this.set = set;
        this.onChain = false;
    }

    serialize()
    {
        if (this.onChain)
        {

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

    get(id: number): Briq
    {
        return this.briqs.get(id);
    }

    getOrCreate(id: number, material?: number, set?: number): Briq
    {
        let briq = new Briq(material, set);
        this.briqs.set(briq.id, briq);
        return briq;
    }
}
