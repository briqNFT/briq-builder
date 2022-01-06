<template>
    <div class="lg:w-1/2 md:w-2/3 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Color Manager</h2>
            <div>
                <p v-for="col, key in palette.colors" class="my-1">
                    <Btn noStyle="true" :class="'mx-1 font-semibold ' + (usedColors[key] > 0 ? 'text-gray-600' : '')" :disabled="usedColors[key] > 0" @click="deleteColor(key)"><i class="fas fa-times"></i></Btn>
                    <Btn noStyle="true" class="mx-1 font-semibold" @click="replaceColor(key)"><i class="far fa-edit"></i></Btn>
                    <span class="w-6 h-6 mx-1 inline-flex justify-center align-center font-bold" :style="{ 'borderRadius': '50%', 'backgroundColor': key }">{{ usedColors[key] ?? 0 }}</span>
                    <span class="font-mono">{{ col }}</span>
                </p>
            </div>
            <Btn class="float-left" @click="resetAll">Reset to default colors</Btn>
            <Btn class="float-left" @click="keepActive">Keep only set colors</Btn>
            <Btn class="float-right" @click="$emit('close')">Close</Btn>
        </div>
    </div>
</template>

<script lang="ts">
import * as THREE from 'three';
import ColorPicker from './ColorPicker.vue';

import { inputStore } from '../../../builder/inputs/InputStore';    
import { palettesMgr } from '../../../builder/Palette';
import { getModal, setModal, setModalAndAwait } from '../../MiddleModal.vue';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    components: {
        ColorPicker
    },
    data() {
        return {
            currentColor: toRef(inputStore, "currentColor"),
        }
    },
    computed: {
        palette() {
            return palettesMgr.getCurrent();
        },
        usedColors(): { [key: string]: number } {
            let ret = {};
            this.$store.state.builderData.currentSet.forEach(cell => {
                if (cell.color in ret)
                    ++ret[cell.color];
                else
                    ret[cell.color] = 1;
            });
            return ret;
        },
    },
    methods: {
        deleteColor(col: string, force: boolean = false) {
            if (!force && this.usedColors[col] > 0)
                return;
            this.palette.deleteColor(col);
            if (this.currentColor === col)
                this.currentColor = this.palette.getFirstColor();
        },
        async replaceColor(col: string) {
            let mod = getModal();
            let result = await setModalAndAwait(ColorPicker, { color: col });
            if (!result)
            {
                setModal(mod);
                return;
            }
            let [res, name] = result;
            this.palette.colors[res] = name;
            let awaits = [];
            this.$store.state.builderData.currentSet.forEach((cell, pos) => {
                if (cell.color === col)
                    awaits.push(this.$store.dispatch("builderData/set_briq_color", [{ pos, color: res }]));
            });
            await Promise.all(awaits);
            this.deleteColor(col, true);
            this.currentColor = res;
            setModal(mod);
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
        }
    },
})</script>