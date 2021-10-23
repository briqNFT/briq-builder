import * as THREE from 'three';

import { reactive } from 'vue';

export const materials = ["Wood", "Stone", "Glass", "Gold"];
export var picker = reactive({
    material: 1,
})

export const tileSize = 1;
export const tileTextureWidth = 3;
export const tileTextureHeight = 1;
const data = new Uint8Array(4*tileTextureWidth*tileTextureHeight);

data[0] = 0;
data[1] = 255;
data[2] = 0;
data[3] = 255;

data[4] = 255;
data[5] = 0;
data[6] = 0;
data[7] = 255;

data[8] = 255;
data[9] = 0;
data[10] = 255;
data[11] = 220;

export const texture = new THREE.DataTexture(data, tileTextureWidth*tileSize, tileTextureHeight*tileSize, THREE.RGBAFormat);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
