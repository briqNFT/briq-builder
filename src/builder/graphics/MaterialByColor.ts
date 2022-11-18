import { THREE } from '@/three';

import lightMapTex from '@/assets/lightmap.png';

import builderSettings from './Settings';

import { watchEffect } from 'vue';

export class MaterialByColor {
    index: number;
    colorIndex: { [key: string]: number };
    indexMaterial: { [key: number]: THREE.Material };

    material: THREE.MeshStandardMaterial;
    lightMapTexture: THREE.Texture;

    size = 256;

    constructor() {
        this.index = 1;
        this.colorIndex = {
            '': 0,
        };
        this.indexMaterial = {};

        const lightMapLoader = new THREE.TextureLoader();
        this.lightMapTexture = lightMapLoader.load(lightMapTex);
        this.lightMapTexture.minFilter = THREE.NearestFilter;
        this.lightMapTexture.magFilter = THREE.NearestFilter;

        this.material = new THREE.MeshStandardMaterial({
            alphaTest: 0.1,
            transparent: false,
            metalness: 0.0,
            roughness: 0.4,
        });
        this.updateTexture();

        watchEffect(() => {
            this.setLightMap(builderSettings.showBorders);
        });
    }

    setLightMap(val: boolean) {
        this.material.lightMap = val ? this.lightMapTexture : null;
        this.material.lightMapIntensity = 2;
        this.material.needsUpdate = true;
    }

    getIndex(color: string) {
        if (color in this.colorIndex)
            return this.colorIndex[color];
        this.colorIndex[color] = this.index++;
        if (this.index >= this.size * this.size)
            throw new Error(
                'ERROR - too many colors - only up to ' + this.size * this.size + ' colors are currently supported',
            );
        this.updateTexture();
        return this.colorIndex[color];
    }

    getUV(index: number, uv: [number, number]): [number, number] {
        // We're using nearest filter, so make sure the UVs end up dead in the middle of the texture pixel.
        return [
            ((index % this.size) + uv[0] * 0.2 + 0.4) / this.size,
            (Math.floor(index / this.size) + uv[1] * 0.2 + 0.4) / this.size,
        ];
    }

    updateTexture() {
        const data = new Uint8Array(this.size * this.size * 4); // RGBA
        let i = 0;
        for (const col in this.colorIndex) {
            if (col === '')
                continue;
            const color = new THREE.Color(col).convertSRGBToLinear();
            // Cheat on colors so that full black isn't perfect black, or borders become completely invisible.
            data[i * 4] = color.r * 253 + 2;
            data[i * 4 + 1] = color.g * 253 + 2;
            data[i * 4 + 2] = color.b * 253 + 2;
            data[i * 4 + 3] = 255;
            ++i;
        }
        const texture = new THREE.DataTexture(data, this.size, this.size, THREE.RGBAFormat, THREE.UnsignedByteType);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        this.material.map = texture;
        this.material.emissiveMap = texture;
        this.material.needsUpdate = true;
    }
}
