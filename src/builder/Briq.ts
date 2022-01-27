import { hexUuid } from '../Uuid';

export class Briq
{
    // Chain metadata
    material: string;
    set: string | undefined;

    // Off-chain metadata
    color: string;

    // NFT ID. If present, this briq is assumed to be an on-chain NFT.
    id: string | undefined;

    constructor(material: string = "0x1", color: string = "#C94A00")
    {
        this.material = material;
        this.color = color;
    }

    setNFTid(id: string)
    {
        this.id = id;
        return this;
    }

    setSet(set: string)
    {
        this.set = set;
        return this;
    }

    serialize()
    {
        // No need to serialize the set, we don't store briqs outside of sets.
        let ret: any = {
            material: this.material,
            color: this.color
        }
        if (this.id)
            ret.id = this.id;
        return ret;
    }

    deserialize(data: any)
    {
        this.material = data.material;
        this.color = data.color;
        if (data.id)
            this.id = data.id;
        return this;
    }

    // Legacy deserializer to parse old sets.
    deserializeV0(data: any)
    {
        this.material = data.material;
        this.color = data.color;
        if (data.briq)
            this.id = data.briq;
        return this;
    }

    clone(): Briq
    {
        let ret = new Briq(this.material, this.color);
        ret.set = this.set;
        ret.id = this.id
        return ret;
    }

    getMaterial()
    {
        return this.material;
    }

    partOfSet()
    {
        return this.set && this.set !== "0x0";
    }
}
