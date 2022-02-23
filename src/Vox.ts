import type { SetData } from "./builder/SetData";

export function toVOX(set: SetData)
{
    let outputs = [];
    // magic header
    outputs.push('VOX ');
    // Version number
    outputs.push(150);

    {
        // Chunk ID
        outputs.push('MAIN');
        // Size
        outputs.push(0);
        // Children
        outputs.push(0);
    }

    let x0: undefined | number;
    let y0: undefined | number;
    let z0: undefined | number;
    let x1: undefined | number;
    let y1: undefined | number;
    let z1: undefined | number;
    set.forEach((briq, pos) => {
        if (x0 === undefined || pos[0] < x0) x0 = pos[0];
        if (x1 === undefined || pos[0] > x1) x1 = pos[0];
        if (y0 === undefined || pos[1] < y0) y0 = pos[1];
        if (y1 === undefined || pos[1] > y1) y1 = pos[1];
        if (z0 === undefined || pos[2] < z0) z0 = pos[2];
        if (z1 === undefined || pos[2] > z1) z1 = pos[2];
    });
    {
        // Chunk ID
        outputs.push('SIZE');
        // Size
        outputs.push(12);
        // Children
        outputs.push(0);
        // Size X/Y/Z (Z is 'up')
        outputs.push(x1 - x0 + 1);
        outputs.push(z1 - z0 + 1);
        outputs.push(y1 - y0 + 1);
    }
    let palette = {} as { [color: string]: number};
    let pi = 1;
    {
        outputs.push('XYZI');
        // Size
        outputs.push(4 + set.getNbBriqs() * 4);
        // Children
        outputs.push(0);
        outputs.push(set.getNbBriqs());
        set.forEach((briq, pos) => {
            if (!(briq.color in palette))
                palette[briq.color] = pi++;
            outputs.push((pos[0] - x0) + (pos[2] - z0) * 256 + (pos[1] - y0) * 256*256 + palette[briq.color] * 256*256*256)
        });
    }
    {
        outputs.push('RGBA');
        // Size
        outputs.push(4*255);
        // Children
        outputs.push(0);

        // Guaranteed to be in insertion order for these non-number keys.
        for (let col in palette)
        {
            console.log(col);
            let nb = 0;
            for (let j = 2; j >= 0; --j)
                nb += Math.pow(256, j) * parseInt(col.substring(1+j*2, 3+j*2), 16)
            nb += 255 * 256 * 256 * 256;
            console.log(nb);
            outputs.push(nb);
        }
        for (let p = pi; p < 255; ++p)
            outputs.push(0);
    }
    outputs[4] = outputs.length * 4 - 3*4;
    var l = 0;
    for (let data of outputs)
        if (typeof(data) === "string")
            l += data.length;
        else
            l += 4;
    let out = new Uint8Array(l);
    let i = 0;
    for (let data of outputs)
    {
        if (typeof(data) === "string")
            for (let c of data)
                out[i++] = c.charCodeAt(0);
        else
        {
            let hex = data.toString(16).padStart(8, '0');
            for (let j = 3; j >= 0; --j)
                out[i++] = parseInt(hex.substring(j*2, j*2+2), 16);
        }
    }
    return out;
}
