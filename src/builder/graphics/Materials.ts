//import * as THREE from 'three';
import { THREE } from '../../three';

import lightMapTex from '../../assets/lightmap.png'

import builderSettings from './Settings'

import { watchEffect } from 'vue';
export class MaterialByColor {
    index: number;
    colorIndex: { [key: string]: number };
    indexMaterial: { [key: number]: THREE.Material };

    material: THREE.Material;
    lightMapTexture: THREE.Texture;

    constructor()
    {
        this.index = 1;
        this.colorIndex = {
            "": 0,
        };
        this.indexMaterial = {};

        const lightMapLoader = new THREE.TextureLoader();
        this.lightMapTexture = lightMapLoader.load(lightMapTex);
        this.lightMapTexture.minFilter = THREE.NearestFilter;
        this.lightMapTexture.magFilter = THREE.NearestFilter;

        this.material = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            transparent: true,
        });
        this.updateTexture();

        watchEffect(() => {
            this.setLightMap(builderSettings.showBorders);
        })
    }

    setLightMap(val: boolean)
    {
        this.material.lightMap = val ? this.lightMapTexture : undefined;
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
        return [((index % 16) + uv[0]*0.9) / 16 + 0.001, (Math.floor(index / 16) + uv[1]*0.9) / 16 + 0.001];
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
