<script setup lang="ts">
import BriqPicker from './BriqPicker.vue';
import { packPaletteChoice, palettesMgr, unpackPaletteChoice } from '../../../builder/Palette';
import { toRef, computed } from 'vue';
import { useStore } from 'vuex'
import type { Briq } from '@/builder/Briq';
import { inputStore } from '../../../builder/inputs/InputStore';
import { pushModal } from '../../Modals.vue';

import Tooltip from '@/components/generic/Tooltip.vue';

import { getIconFromMaterial, getNameFromMaterial } from '@/Conf';

const currentColor = toRef(inputStore, 'currentColor');
const currentMaterial = toRef(inputStore, 'currentMaterial');
const currentKey = computed(() => packPaletteChoice(currentMaterial.value, currentColor.value));

const palette = computed(() => palettesMgr.getCurrent());
const choices = computed(() => palette.value.getChoices());

const store = useStore();

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

const setChoices = computed(() => {
    return Object.keys(setColors.value).map(key => [key, ...Object.values(unpackPaletteChoice(key)), key]);
})

const anySetChoiceNotInPalette = computed(() => Object.keys(setColors.value).some(key => palette.value.choices.indexOf(key) !== -1));

const addChoice = async (hint?: string) => {
    let result = (await pushModal(BriqPicker, hint ? { color: hint } : {})) as [string, string, string];
    if (!result)
        return;
    let [new_color, name, new_material] = result;
    palette.value.addChoice({ material: new_material, color: new_color }, name);
}

const deleteChoice = (key: string) => {
    palette.value.deleteChoice({ key });
    if (currentKey.value === key) {
        const { material, color } = palette.value.getFirstChoice();
        currentColor.value = color;
        currentMaterial.value = material;
    }
};

const keepActive = () => {
    for (let key of palette.value.choices.slice())
        if (!setColors.value[key])
            deleteChoice(key);
};

const addAllActive = () => {
    for (let key in setColors.value)
        palette.value.addChoice({ key }, key);
};

const resetAll = () => {
    palette.value.reset();
    palette.value.updateForSet(store.state.builderData.currentSet);
    const { material, color } = palette.value.getFirstChoice();
    currentColor.value = color;
    currentMaterial.value = material;
};

const replaceColor = async (key: string) => {
    const old_key = unpackPaletteChoice(key);
    let result = (await pushModal(BriqPicker, { color: old_key.color })) as [string, string, string];
    if (!result)
        return;
    let [new_color, name, new_material] = result;
    const new_key = packPaletteChoice(new_material, new_color);

    let data = [] as any[];
    store.state.builderData.currentSet.forEach((cell: Briq, pos: any) => {
        if (cell.color === old_key.color && cell.material === old_key.material)
            data.push({ pos, color: new_color, material: new_material });
    });
    await store.dispatch('builderData/set_briq_color', data);
    currentColor.value = new_color;
    currentMaterial.value = new_material;
};

const paletteLayout = computed(() => {
    return 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] max-h-[50vh] overflow-y-scroll'
});
const setBriqLayout = computed(() => {
    return 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] max-h-[50vh] overflow-y-scroll'
});
</script>

<template>
    <Window size="lg:w-3/5 md:w-2/3 w-full">
        <template #big-title>Palette Manager</template>
        <div class="flex flex-wrap gap-2">
            <div class="grow flex flex-col justify-between">
                <div>
                    <h3>Palette</h3>
                    <div :class="paletteLayout">
                        <p v-for="[key, material, color, name] in choices" class="my-1" :key="key">
                            <Btn tooltip="Remove from palette"
                                no-style="true"
                                :class="'font-semibold '"
                                @click="deleteChoice(key)">
                                <i class="fas fa-times"/>
                            </Btn>
                            <Btn tooltip="Choose a new color based on this one"
                                no-style="true"
                                :class="'ml-1 font-semibold '"
                                @click="addChoice(color)">
                                <i class="far fa-copy"></i>
                            </Btn>
                            <span
                                class="w-6 h-6 mx-1 inline-flex justify-center align-center font-bold"
                                :style="{ borderRadius: '50%', backgroundColor: color, textShadow: '1px 1px 1px rgba(0, 0, 0, 0.4)' }">{{ setColors[key] ?? 0 }}</span>
                            <span class="font-mono">
                                {{ color }}</span>
                        </p>
                    </div>
                </div>
                <div class="flex gap-1 flex-wrap justify-around">
                    <Btn class="grow" @click="addChoice()"><i class="fas fa-add"></i> Add new choice</Btn>
                    <Btn class="grow" @click="resetAll"><i class="fas fa-power-off"></i> Reset to default colors</Btn>
                    <Btn class="grow"
                        :disabled="!store.state.builderData.currentSet.getNbBriqs()"
                        @click="keepActive">
                        <i class="fa-solid fa-compress"></i> Keep only used colors
                    </Btn>
                </div>
            </div>
            <div v-if="setChoices.length" class="grow flex flex-col justify-between">
                <div>
                    <h3>Used in the current set</h3>
                    <div :class="setBriqLayout">
                        <p v-for="[key, material, color, name] in setChoices" class="my-1" :key="key">
                            <Btn no-style="true" :class="'mx-1 font-semibold' + (palette.choices.indexOf(key) !== -1 ? ' text-gray-500' : '')"
                                tooltip="Add to palette" @click="palette.addChoice(material, color, name)"
                                :disabled="palette.choices.indexOf(key) !== -1">
                                <i class="fas fa-add"/>
                            </Btn>
                            <Btn no-style="true" class="mx-1 font-semibold" tooltip="Change the color of all these briqs" @click="replaceColor(key)">
                                <i class="far fa-edit"/>
                            </Btn>
                            <span
                                class="w-6 h-6 mx-1 inline-flex justify-center align-center font-bold"
                                :style="{ borderRadius: '50%', backgroundColor: color }">{{ setColors[key] ?? 0 }}</span>
                            <span class="font-mono">{{ color }}</span>
                        </p>
                    </div>
                    <div class="flex gap-1 flex-wrap justify-around">
                        <Btn class="flex-grow" @click="addAllActive" :disabled="anySetChoiceNotInPalette"><i class="fas fa-add"></i> Add all to palette</Btn>
                    </div>
                </div>
            </div>
        </div>
    </Window>
</template>
