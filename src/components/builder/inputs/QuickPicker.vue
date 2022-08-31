<script setup lang="ts">
import BriqPicker from '../modals/BriqPicker.vue';
import PaletteManager from '../modals/PaletteManager.vue';

import { useStore } from 'vuex';
import { inputStore } from '../../../builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr, unpackPaletteChoice } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';
import { builderInputFsm } from '../../../builder/inputs/BuilderInput';
import type { ChainBriqs } from '@/builder/ChainBriqs';

import ColorWheel from '@/assets/colorwheel.png';

import { computed, inject, ref, toRef } from 'vue';

import { addMaterialCSS } from '@/Conf';
import { useBuilder } from '../BuilderComposable';
import ColorPicker from '@/components/generic/ColorPicker.vue';
import Flyout from '@/components/generic/Flyout.vue';

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

const deleteTargetChoice = () => {
    palette.value.deleteChoice({ key: contextMenuTarget.value?.dataset['target'] });
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

const pickerOpen = ref(false);

const contextMenuTarget = ref(null as null | HTMLElement);

const onOpenContextMenu = (event: PointerEvent) => {
    contextMenuTarget.value = (event.target as HTMLElement).nextElementSibling as HTMLElement;
    willClose();
}

const INITIAL_DELAY = 750;
let closeTimer: any;
const willClose = () => closeTimer = setTimeout(() => contextMenuTarget.value = null, INITIAL_DELAY);
const dropClose = () => closeTimer && clearTimeout(closeTimer);

</script>

<template>
    <div class="flex flex-col">
        <div class="rounded-md border border-grad-light bg-grad-lightest max-w-[16rem] !text-sm">
            <div class="bg-grad-lighter p-4 bg-opacity-50">
                <h4 class="font-medium text-md">Palette</h4>
            </div>
            <div class="p-4">
                <div class="flex items-center gap-1 relative">
                    <div class="inline-block w-4 h-4 rounded-sm absolute left-2 pointer-events-none" :style="{ backgroundColor: inputStore.currentColor }"/>
                    <input type="text" v-model="inputStore.currentColor" class="py-0 h-8 pl-8 grow" size="8">
                    <Btn no-background @click="pickerOpen = !pickerOpen" class="p-0"><img :src="ColorWheel"></Btn>
                </div>
                <div class="flex flex-wrap gap-1 my-2">
                    <template v-for="[key, material, color, name] in choices" :key="key">
                        <div>
                            <Btn
                                no-style
                                :class="`rounded-sm w-4 h-4 p-0 flex justify-center items-center mat-${material} hover:ring-2 ring-grad-darkest`"
                                :style="addMaterialCSS(material, color)"
                                :tooltip="'Select color ' + name"
                                @click="pickBriq(key)"
                                @dblclick="pickBriq(key); changeColor()"
                                @contextmenu.prevent.stop="onOpenContextMenu"/>
                            <!-- This empty div is there to teleport the context menu. -->
                            <div class="relative" :data-target="key"/>
                        </div>
                    </template>
                    <Btn no-background @click="addCurrentChoice" class="p-0 w-4 h-4 flex justify-center items-center">+</Btn>
                </div>
                <Teleport v-if="contextMenuTarget" :to="contextMenuTarget">
                    <Flyout class="!absolute z-[50] top-[0] left-0" @pointerenter="dropClose" @pointerleave="contextMenuTarget = null">
                        <Btn no-background @click="deleteTargetChoice">Remove</Btn>
                    </Flyout>
                </Teleport>
            </div>
        </div>
        <div v-if="pickerOpen" class="flex flex-col bg-grad-lightest shadow-md rounded mt-1 p-2">
            <ColorPicker :color="inputStore.currentColor" @color-change="col => inputStore.currentColor = col"/>
        </div>
    </div>
</template>

<style scoped></style>
