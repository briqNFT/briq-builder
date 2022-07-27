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

const store = useStore();

const messages = inject('messages');
const chainBriqs = inject('chainBriqs');

// TODO: reduce duplication here.
const palette = computed(() => palettesMgr.getCurrent());
const choices = computed(() => palette.value.getChoices());

const currentKey = computed(() => packPaletteChoice(inputStore.currentMaterial, inputStore.currentColor));

const availableNFTs = computed(() => {
    let nfts = (chainBriqs as ChainBriqs).getNFTs();
    let briqs = store.state.builderData.currentSet.getAllBriqs();
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
    store.state.builderData.currentSet.forEach((cell: Briq) => {
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
    <div class="w-full">
        <div class="grid grid-cols-3 gap-0.5 my-0.5">
            <Btn class="col-span-3" @click="resetAll" tooltip="Reset the palette to default colors">Reset</Btn>
            <Btn class="col-span-3" @click="addAllActive" tooltip="Add the set colors to the palette">Add set<br>colors</Btn>
            <Btn
                v-if="palette.choices.indexOf(currentKey) === -1"
                class="p-0" @click="addCurrentChoice" tooltip="Add the current color to the palette permanently">
                <i class="fa-solid fa-add"/>
            </Btn>
            <Btn v-else="" class="p-0" @click="addChoice" tooltip="Add a new color"><i class="fa-solid fa-add"/></Btn>
            <Btn class="p-0" @click="deleteChoice" tooltip="Remove the current color from the palette"><i class="far fa-trash-alt"/></Btn>
            <Btn class="p-0" @click="changeColor" tooltip="Edit selected color"><i class="fa-solid fa-pen-to-square"/></Btn>
        </div>
        <!-- Flex to occupy width-->
        <div class="flex-1 overflow-auto pb-0.5">
            <div
                :class="choiceLayout">
                <div
                    v-if="inputStore.currentInput.indexOf('place') !== -1"
                    class="col-span-3 flex flex-col"
                    v-for="(value, key) in availableNFTs"
                    :key="key">
                    <Btn
                        class="h-5 min-h-0 shadow-md m-0 p-0 leading-3"
                        :tooltip="'Place keystone'"
                        @click="pickNFT(value)"
                        :style="{
                            backgroundColor: '#555555',
                            border: inputStore.currentInput == 'place_nft' ? '3px solid black' : '0px solid black',
                        }">
                        Keystone
                    </Btn>
                </div>

                <div class="flex flex-col" v-for="[key, material, color, name] in choices" :key="key">
                    <Btn
                        :class="'h-5 min-h-0 shadow-md flex justify-end items-center ' + `mat-${material}`"
                        :tooltip="'Select color ' + name"
                        @click="pickBriq(key)"
                        @dblclick="pickBriq(key); changeColor()"
                        :style="addMaterialCSS(material, color, {
                            border:
                                inputStore.currentInput != 'place_nft' && currentKey === key
                                    ? '3px solid black'
                                    : '0px solid black',
                        })">
                        {{ material }}
                    </Btn>
                </div>
                <Btn
                    v-if="palette.choices.indexOf(currentKey) === -1"
                    class="h-5 min-h-0 shadow-md flex justify-end items-center"
                    :style="{
                        backgroundColor: inputStore.currentColor,
                        border: '2px dashed black',
                    }">
                    {{ inputStore.currentMaterial }}
                </Btn>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
