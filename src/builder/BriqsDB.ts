import { hexUuid } from '../Uuid';

export class Briq
{
    id: string;
    material: number;
    set: string;
    onChain: boolean;

    color: string;

    constructor(id: string, material: number, set: string)
    {
        this.id = id;
        this.material = material;
        this.set = set;
        this.onChain = false;
        this.color = "#000000";
    }

    partOfSet()
    {
        return this.set && this.set !== "0x0";
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
            this.id = hexUuid();
        this.material = data.material;
        this.set = data.set;
        this.color = data.color;
        return this;
    }

    clone(): Briq
    {
        let ret = new Briq(this.id, this.material, this.set);
        ret.color = this.color;
        ret.onChain = this.onChain;
        return ret;
    }

}

export class BriqsDB
{
    briqs: Map<string, Briq>
    constructor()
    {
        this.briqs = new Map();
    }

    deserializeBriq(data: any): Briq
    {
        let cell = new Briq("", 0, "").deserialize(data)
        this.briqs.set(cell.id, cell);
        return cell;
    }

    reset()
    {
        this.briqs = new Map();
    }
    
    get(id: string): Briq | undefined
    {
        return this.briqs.get(id);
    }

    /**
     * Create a local copy of an on-chain briq or create a new local briq.
     * @param id 
     * @returns 
     */
    getOrCreate(id: string | undefined): Briq
    {
        if (id)
        {
            let cell = this.get(id);
            if (cell)
                return cell;
            this.briqs.set(id, new Briq(id, 1, ""));
            return this.briqs.get(id)!;
        }
        return this.create(hexUuid(), 1, "");
    }

    add(briq: Briq)
    {
        this.briqs.set(briq.id, briq);
    }

    create(id: string, material: number, set: string): Briq
    {
        let briq = new Briq(id, material, set);
        this.briqs.set(briq.id, briq);
        return briq;
    }
}
