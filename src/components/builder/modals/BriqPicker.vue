<script setup="props, context" lang="ts">
import ColorPicker from '../../generic/ColorPicker.vue';

import { getNameFromMaterial, CONF } from '@/Conf';
import { inputStore } from '@/builder/inputs/InputStore';

import { ref, computed, defineEmits} from 'vue';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';

const toto = ref(null);

const emit = defineEmits(['close']);

const palette = computed(() => palettesMgr.getCurrent());

const curMat = ref(inputStore.currentMaterial);
const color = ref(undefined as undefined | string);

const pick = function () {
    emit('close', [color.value, color.value, curMat.value]);
};

const getBadPickReason = computed(() => {
    if (!color.value || !color.value.match(/^\#[abcdef0-9]{6}$/i))
        return "Cannot pick, incorrect color";
    if (palette.value.choices.indexOf(packPaletteChoice(curMat.value, color.value)) !== -1)
        return "Canot pick, color already in palette";
    return undefined;
});

</script>

<template>
    <Window size="md:w-3/5 w-auto md:max-w-[45rem]">
        <template #big-title>briq picker</template>
        <div class="flex justify-between gap-2" ref="toto">
            <div class="flex-auto flex justify-stretch items-center flex-col font-medium pt-8">
                <ColorPicker
                    :color="color || metadata?.color"
                    @colorChange="
                        (col) => {
                            color = col;
                        }
                    "/>
                <p class="flex justify-center gap-2 my-4">
                    <span
                        class="inline-block w-20 h-8 rounded-md border-2 border-white"
                        :style="{ backgroundColor: color }"/>
                    <input class="text-center" type="text" maxlength="7" size="7" v-model="color">
                </p>
            </div>
        </div>
        <div class="flex justify-center my-2">
            <Btn class="min-w-[10rem]" @click="pick" :disabled="!!getBadPickReason">{{ getBadPickReason || 'Pick' }}</Btn>
        </div>
    </Window>
</template>

<script lang="ts">


import { defineComponent } from 'vue';
export default defineComponent({
    props: ['metadata'],
    mounted() {
        if (!this.metadata?.color)
            return;
        this.color = this.metadata?.color;
    },

});
</script>
