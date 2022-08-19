<script setup lang="ts">
import BriqPicker from '../modals/BriqPicker.vue';
import PaletteManager from '../modals/PaletteManager.vue';

import { useStore } from 'vuex';
import { inputStore } from '../../../builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr, unpackPaletteChoice } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';
import { builderInputFsm } from '../../../builder/inputs/BuilderInput';
import type { ChainBriqs } from '@/builder/ChainBriqs';

import { computed, inject, toRef } from 'vue';

import { addMaterialCSS } from '@/Conf';
import { useBuilder } from '../BuilderComposable';

const { currentSet } = useBuilder();

const store = useStore();

const messages = inject('messages');
const chainBriqs = inject('chainBriqs');

// TODO: reduce duplication here.
const palette = computed(() => palettesMgr.getCurrent());
const choices = computed(() => palette.value.getChoices());

const currentKey = computed(() => packPaletteChoice(inputStore.currentMaterial, inputStore.currentColor));

const availableNFTs = computed(() => {
    let nfts = (chainBriqs as ChainBriqs).getNFTs();
    let briqs = currentSet.value.getAllBriqs();
    let av = [];
    for (let nft of nfts)
        if (!briqs.find((x: any) => x.id === nft.token_id))
            av.push(nft);

    return av;
});

const changeColor = async () => {
    let result = (await pushModal(BriqPicker, { color: inputStore.currentColor })) as [string, string, string];
    if (!result)
        return;
    let [hex, name, material] = result;
    if (hex === inputStore.currentColor && material === inputStore.currentMaterial)
        return;
    palette.value.swapChoice(
        { material: inputStore.currentMaterial, color: inputStore.currentColor },
        { material: material, color: hex },
    );
    inputStore.currentColor = hex;
    inputStore.currentMaterial = material;
};

const addCurrentChoice = () => {
    palette.value.addChoice(
        { material: inputStore.currentMaterial, color: inputStore.currentColor },
        packPaletteChoice(inputStore.currentMaterial, inputStore.currentColor),
    );
}

const addChoice = async () => {
    let result = (await pushModal(BriqPicker, { color: inputStore.currentColor })) as [string, string, string];
    if (!result)
        return;
    let [hex, name, material] = result;
    palette.value.addChoice({ material, color: hex }, name);
    inputStore.currentColor = hex;
    inputStore.currentMaterial = material;
}

const deleteChoice = () => {
    palette.value.deleteChoice({ material: inputStore.currentMaterial, color: inputStore.currentColor });
    const { material, color } = palette.value.getFirstChoice();
    inputStore.currentColor = color;
    inputStore.currentMaterial = material;
};

const setColors = computed((): { [key: string]: number } => {
    let ret = {} as { [key:string]: number };
    currentSet.value.forEach((cell: Briq) => {
        const key = packPaletteChoice(cell.material, cell.color);
        if (key in ret)
            ++ret[key];
        else
            ret[key] = 1;
    });
    return ret;
});

const resetAll = () => {
    palette.value.reset();
};

const addAllActive = () => {
    for (let key in setColors.value)
        palette.value.addChoice({ key }, key);
};

const pickBriq = (key: string) => {
    const { material, color } = unpackPaletteChoice(key);
    inputStore.currentColor = color;
    inputStore.currentMaterial = material;
    if (inputStore.currentInput === 'place_nft')
        builderInputFsm.switchTo('place');
};

const pickNFT = (nft: any) => {
    builderInputFsm.switchTo('place_nft', nft);
};

const choiceLayout = computed(() => {
    // For small # of items, the layout is a single column
    if (palette.value.getNbChoices() < 14)
        return ' gap-0.5 flex flex-col';
    // For larger # of items, the layout is a few columns
    else if (palette.value.getNbChoices() < 24)
        return 'gap-0.5 grid-cols-2 grid-flow-row';
    else
        return 'gap-0.5 grid-cols-3 grid-flow-row';
})

</script>

<template>
    <div class="rounded-md overflow-hidden border border-grad-light bg-grad-lightest max-w-[200px] !text-sm">
        <div class="bg-grad-lighter p-4">
            <h4 class="font-medium">Palette</h4>
        </div>
        <div class="p-4">
            <div class="flex items-center gap-1">
                <div class="inline-block w-7 h-7 rounded-sm" :style="{ backgroundColor: inputStore.currentColor }"/>
                <input type="text" v-model="inputStore.currentColor" class="py-0 h-8" size="7">
            </div>
            <div class="flex flex-wrap gap-1 my-2">
                <Btn
                    no-style
                    v-for="[key, material, color, name] in choices" :key="key"
                    :class="`rounded-sm w-7 h-7 p-0 flex justify-center items-center mat-${material}`"
                    :style="addMaterialCSS(material, color)"
                    :tooltip="'Select color ' + name"
                    @click="pickBriq(key)"
                    @dblclick="pickBriq(key); changeColor()"/>
                <Btn no-background class="p-0 w-7 h-7 flex justify-center items-center">+</Btn>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
