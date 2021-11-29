import * as THREE from 'three';

import { pickerData, texture, tileSize, tileTextureHeight, nbMaterial } from '../../materials.js'

class MaterialByColor {
    index: number;
    colorIndex: { [key: string]: number };
    indexMaterial: { [key: number]: THREE.Material };

    material: THREE.Material;

    constructor()
    {
        this.index = 1;
        this.colorIndex = {
            "": 0,
        };
        this.indexMaterial = {};

        this.material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            transparent: true,
        });
    }

    getIndex(color: string)
    {
        if (color in this.colorIndex)
            return this.colorIndex[color];
        this.colorIndex[color] = this.index++;
        this.updateTexture();
        return this.colorIndex[color];
    }

    getUV(index: number, uv: [number, number]): [number, number]
    {
        return [((index % 16) + uv[0]) / 16, (Math.floor(index / 16) + uv[1]) / 16];
    }

    updateTexture()
    {
        const data = new Uint8Array(16*16 * 4); // RGBA
        let i = 0;
        for (let col in this.colorIndex)
        {
            if (col === "")
                continue;
            const color = new THREE.Color(col);
            data[i*4] = color.r * 255;
            data[i*4+1] = color.g * 255;
            data[i*4+2] = color.b * 255;
            data[i*4+3] = 255;
            ++i;
        }
        const texture = new THREE.DataTexture(data, 16, 16, THREE.RGBAFormat);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        this.material.map = texture;
        this.material.needsUpdate = true;
    }
}

export var materialByColor = new MaterialByColor();
