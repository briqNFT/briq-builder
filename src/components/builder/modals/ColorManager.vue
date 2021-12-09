<script setup lang="ts">
import Button from '../../generic/Button.vue';
import ColorPicker from './ColorPicker.vue';
</script>

<template>
    <div class="w-1/2">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Color Manager</h2>
            <div>
                <p v-for="col, key in palette.colors" class="my-1">
                    <Button noStyle="true" class="mx-0.5 font-semibold" :disabled="usedColors[key] > 0" @click="deleteColor(key)"><i class="fas fa-times"></i></Button>
                    <Button noStyle="true" class="mx-0.5 font-semibold" :disabled="(usedColors?.[key] ?? 0) == 0" @click="replaceColor(key)"><i class="fas fa-retweet"></i></Button>
                    <span class="w-6 h-6 mx-1 inline-flex justify-center align-center font-bold" :style="{ 'borderRadius': '50%', 'backgroundColor': key }">{{ usedColors[key] ?? 0 }}</span>
                    <span class="font-mono">{{ col }}</span>
                </p>
            </div>
            <Button class="float-left" @click="resetAll">Reset to default colors</Button>
            <Button class="float-left" @click="keepActive">Keep only set colors</Button>
            <Button class="float-right" @click="$emit('close')">Close</Button>
        </div>
    </div>
</template>

<script lang="ts">
import * as THREE from 'three';

import { inputStore } from '../../../builder/inputs/InputStore';    
import { palettesMgr } from '../../../builder/Palette';
import { getModal, setModal, setModalAndAwait } from '../../MiddleModal.vue';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
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
        deleteColor(col: string) {
            if (this.usedColors[col] > 0)
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
            this.$store.state.builderData.currentSet.forEach((cell, pos) => {
                if (cell.color === col)
                    this.$store.dispatch("builderData/set_briq_color", [{ pos, color: res }]);
            })
            this.deleteColor(col);
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