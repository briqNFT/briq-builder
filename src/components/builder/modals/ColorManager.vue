<template>
    <Window size="lg:w-1/2 md:w-2/3 w-full">
        <template #big-title>Color Manager</template>
        <div
            :class="
                (palette.getNbColors() > 20 ? 'grid grid-cols-2 lg:grid-cols-3' : '') + ' max-h-[80vh] overflow-auto'
            ">
            <p v-for="(col, key) in palette.colors" class="my-1">
                <Btn
                    no-style="true"
                    :class="'mx-1 font-semibold ' + (usedColors[key] > 0 ? 'text-gray-600' : '')"
                    :disabled="palette.getNbColors() == 1 || usedColors[key] > 0"
                    @click="deleteColor(key)">
                    <i class="fas fa-times"/>
                </Btn>
                <Btn no-style="true" class="mx-1 font-semibold" @click="replaceColor(key)">
                    <i class="far fa-edit"/>
                </Btn>
                <span
                    class="w-6 h-6 mx-1 inline-flex justify-center align-center font-bold"
                    :style="{ borderRadius: '50%', backgroundColor: key }">{{ usedColors[key] ?? 0 }}</span>
                <span class="font-mono">{{ col }}</span>
            </p>
        </div>
        <Btn class="float-left my-4" @click="resetAll">Reset to default colors</Btn>
        <Btn
            class="float-left mx-2 my-4"
            :disabled="!$store.state.builderData.currentSet.getNbBriqs()"
            @click="keepActive">
            Keep only set colors
        </Btn>
    </Window>
</template>

<script lang="ts">
import ColorPicker from './ColorPicker.vue';

import { inputStore } from '../../../builder/inputs/InputStore';
import { palettesMgr } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    components: {
        ColorPicker,
    },
    data() {
        return {
            currentColor: toRef(inputStore, 'currentColor'),
        };
    },
    computed: {
        palette() {
            return palettesMgr.getCurrent();
        },
        usedColors(): { [key: string]: number } {
            let ret = {};
            this.$store.state.builderData.currentSet.forEach((cell) => {
                if (cell.color in ret)
                    ++ret[cell.color];
                else
                    ret[cell.color] = 1;
            });
            return ret;
        },
    },
    methods: {
        deleteColor(col: string, force = false) {
            if (!force && this.usedColors[col] > 0)
                return;
            this.palette.deleteColor(col);
            if (this.currentColor === col)
                this.currentColor = this.palette.getFirstColor();
        },
        async replaceColor(col: string) {
            let result = (await pushModal(ColorPicker, { color: col })) as [string, string];
            if (!result)
                return;
            let [res, name] = result;
            this.palette.colors[res] = name;
            let awaits = [];
            let data = [] as any[];
            this.$store.state.builderData.currentSet.forEach((cell, pos) => {
                if (cell.color === col)
                    data.push({ pos, color: res });
            });
            await this.$store.dispatch('builderData/set_briq_color', data);
            this.deleteColor(col, true);
            this.currentColor = res;
        },
        resetAll() {
            this.palette.reset();
            this.palette.updateForSet(this.$store.state.builderData.currentSet);
            this.currentColor = this.palette.getFirstColor();
        },
        keepActive() {
            for (let col in this.palette.colors)
                if (!this.usedColors[col])
                    this.deleteColor(col);
        },
    },
});
</script>
