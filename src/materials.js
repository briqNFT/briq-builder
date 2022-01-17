import { reactive } from 'vue';

export var materialData = {
    "Wood": {color: [90, 57, 24], transparency: 255},
    "Concrete": {color: [228, 217, 197], transparency: 255},
    "Glass": {color: [199, 227, 225], transparency: 220},
    "Steel": {color: [94, 104, 109], transparency: 255},
};

export var pickerData = reactive({
    tempStore: {1: 0, 2: 0,3: 0,4: 0}, //tempStore is the array counting the bricks currently used in the builder
    material: 1,
    currentSet: 0,
})

export const tileSize = 1;
export const nbMaterial = Object.keys(materialData).length; //rename & get length of material data
export const tileTextureHeight = 1;
const data = new Uint8Array(4*nbMaterial*tileTextureHeight);

export var materialIndex = Object.keys(materialData);
for (let i in materialIndex){
    data[i*4] = materialData[materialIndex[i]].color[0]
    data[i*4+1] = materialData[materialIndex[i]].color[1]
    data[i*4+2] = materialData[materialIndex[i]].color[2]
    data[i*4+3] = materialData[materialIndex[i]].transparency
}
