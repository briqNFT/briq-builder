<script setup lang="ts">
import BriqPicker from '../modals/BriqPicker.vue';

import { packPaletteChoice, palettesMgr, unpackPaletteChoice } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';
import { builderInputFsm } from '../../../builder/inputs/BuilderInput';

import ColorWheel from '@/assets/colorwheel.png';

import { computed, ref, toRef, watch } from 'vue';

import { addMaterialCSS } from '@/Conf';
import ColorPicker from '@/components/generic/ColorPicker.vue';
import Flyout from '@/components/generic/Flyout.vue';
import { useBuilderInput } from '../InputComposable';
import { builderHistory } from '@/builder/BuilderHistory';
import { PaintBriqs } from '@/builder/BuilderActions';

const { inputStore, activeInputButton } = useBuilderInput();


// TODO: reduce duplication here.
const palette = computed(() => palettesMgr.getCurrent());
const choices = computed(() => palette.value.getChoices());

const currentColor = computed({
    get: () => {
        return inputStore.currentColor.toLowerCase();
    },
    set: (v) => {
        if (v.match(/^#[abcdef0-9]{6}$/i))
            inputStore.currentColor = v.toLowerCase();
    },
})

watch([toRef(inputStore, 'currentColor'), toRef(inputStore, 'currentMaterial')], () => {
    if (activeInputButton.value !== 'select')
        return;
    changeColorOfSelectedBriqs();
})

const changeColorOfSelectedBriqs = () => {
    const change = [] as any;
    inputStore.selectionMgr.selectedBriqs.map(x => change.push({
        pos: x.position,
        color: inputStore.currentColor,
        material: inputStore.currentMaterial,
    }))
    builderHistory.push_command(PaintBriqs, change);
    builderHistory.push_checkpoint();
}

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

const pickBriq = (key: string) => {
    const { material, color } = unpackPaletteChoice(key);
    inputStore.currentColor = color;
    inputStore.currentMaterial = material;
    if (inputStore.currentInput === 'place_nft')
        builderInputFsm.switchTo('place');
    if (activeInputButton.value === 'select')
        changeColorOfSelectedBriqs();
};

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

<style scoped>
.dark #app .tempdarkfix {
    @apply border border-grad-light shadow-none;
}
</style>

<template>
    <div class="flex flex-col">
        <div class="rounded border border-grad-light bg-grad-lightest max-w-[14.5rem] !text-sm">
            <div class="bg-grad-lighter p-4 py-3 rounded-t">
                <h4 class="font-semibold text-sm leading-figma">Color palette</h4>
            </div>
            <div class="pl-4 pr-2 pb-4 pt-3">
                <div class="flex items-center gap-2 relative">
                    <div class="inline-block w-4 h-4 rounded-sm absolute left-3 pointer-events-none" :style="{ backgroundColor: inputStore.currentColor }"/>
                    <input type="text" @keydown.stop v-model="currentColor" class="py-0 h-10 pl-9 grow" size="8">
                    <p @click="pickerOpen = !pickerOpen" class="p-2 flex justify-center items-center cursor-pointer select-none"><img class="w-6 h-6" :src="ColorWheel"></p>
                </div>
                <div class="flex flex-wrap gap-1 mt-4">
                    <template v-for="[key, material, color, name] in choices" :key="key">
                        <div>
                            <Btn
                                no-style
                                :class="`rounded-sm w-5 h-5 p-0 flex justify-center items-center mat-${material} hover:ring-2 ring-grad-light`"
                                :style="addMaterialCSS(material, color)"
                                :tooltip="`Select color ${name}, right-click to remove`"
                                @click="pickBriq(key)"
                                @dblclick="pickBriq(key); changeColor()"
                                @contextmenu.prevent.stop="onOpenContextMenu"/>
                            <!-- This empty div is there to teleport the context menu. -->
                            <div class="relative" :data-target="key"/>
                        </div>
                    </template>
                    <Btn no-background @click="addCurrentChoice" class="p-0 w-5 h-5 flex justify-center items-center">+</Btn>
                </div>
                <Teleport v-if="contextMenuTarget" :to="contextMenuTarget">
                    <Flyout class="!absolute z-[50] top-[0] left-0" @pointerenter="dropClose" @pointerleave="contextMenuTarget = null">
                        <Btn class="font-normal m-1" no-background @click="deleteTargetChoice">Remove</Btn>
                    </Flyout>
                </Teleport>
            </div>
        </div>
        <div v-if="pickerOpen" class="flex flex-col bg-grad-lightest shadow-md rounded tempdarkfix mt-2 p-2">
            <ColorPicker :color="inputStore.currentColor" @color-change="col => inputStore.currentColor = col"/>
        </div>
    </div>
</template>

<style scoped></style>
