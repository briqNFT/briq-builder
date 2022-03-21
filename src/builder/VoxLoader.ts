import voxReader from 'vox-reader';
import { hexUuid } from '@/Uuid';
import { SetData } from './SetData';
import { Briq } from './Briq';

import { THREE } from '@/three';
import { number } from 'starknet';
import { nTRN, VoxStructure } from 'vox-reader/types/types';
import { MATERIAL_GENESIS } from '@/builder/ChainBriqs';

export class VoxLoader
{
    data: VoxStructure;
    set: SetData;
    colors: string[] = [];

    warnings: string[] = [];

    material = MATERIAL_GENESIS;

    constructor(fileData: ArrayBuffer)
    {
        this.data = voxReader(new Uint8Array(fileData) as unknown as number[]);
        
        for (let _ of this.data.RGBA)
            for (let c of _.values)
                this.colors.push("#" + new THREE.Color().fromArray([c.r/255, c.g/255, c.b/255]).getHexString());
        this.set = new SetData(hexUuid());

        if (this.data.nTRN?.length)
        {
            this.parseAndDescendNode(this.data.nTRN[0], [0, 0, 0])
        }
        else
        {
            for (let i in this.data.XYZI)
            {
                let offsetX = Math.floor(this.data.SIZE[i].x / 2);
                let offsetY = Math.floor(this.data.SIZE[i].y / 2);    
                for (let voxel of this.data.XYZI[i].values)
                {
                    let briq = new Briq(this.material, this.colors[voxel.i - 1])
                    this.set.placeBriq(this.data.SIZE[i].x - voxel.x - offsetX, voxel.z, voxel.y - offsetY, briq);
                }
            }
        }
    }

    /**
     * Plop the model down at the right coordinates.
     * A few notes: MagicaVoxel uses Z-up, whereas we are Y-up, so we need to swap those and then invert the Z axis.
     * Models are also centered on their node instead of just plopped there, which appears to be undocumented.
     */
    parseModel(i: number, offset: [number, number, number])
    {
        let offsetX = Math.floor(this.data.SIZE[i].x / 2);
        let offsetY = Math.floor(this.data.SIZE[i].y / 2);
        let offsetZ = Math.floor(this.data.SIZE[i].z / 2);
        for (let voxel of this.data.XYZI[i].values)
        {
            let pos = [voxel.x + offset[0] - offsetX, voxel.z + offset[2] - offsetZ, this.data.SIZE[i].y - voxel.y + offset[1] - offsetY];
            if (this.set.getAt(...pos))
                this.warnings.push(`Overlapping briqs at ${pos}. Only one will be kept.`)
            let briq = new Briq(this.material, this.colors[voxel.i - 1])
            this.set.placeBriq(...pos, briq)
        }
    }
    
    parseAndDescendNode(node: nTRN, offset: [number, number, number])
    {
        if (node.frames[0]._r)
            this.warnings.push("Warning: a Transform node with rotation was found. Rotation nodes are unsupported.");

            offset = offset.slice();
        if (node.frames[0]._t)
        {
            let offs = node.frames[0]._t.split(" ");
            offset[0] += +offs[0];
            offset[1] += -offs[1];
            offset[2] += +offs[2];
        }
    
        let child = this.data.nGRP!.find(x => x.nodeId === node.child);
        if (child)
            for (let ch of child.children)
            {
                let ns = this.data.nTRN!.find(x => x.nodeId === ch)!;
                if (!ns)
                    throw new Error(`Node ${ns} not found in .vox`)
                else
                    this.parseAndDescendNode(ns, offset);
            }
        else
            // Must be a shape node directly
            this.data.nSHP!.find(x => x.nodeId === node.child)!.models.forEach(modAttr => this.parseModel(modAttr[0], offset))
    }
}
