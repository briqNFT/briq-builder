<script setup lang="ts">
import Button from '../../generic/Button.vue'
import ColorPicker from '../modals/ColorPicker.vue';
import ColorManager from '../modals/ColorManager.vue';
</script>

<template>
    <!-- Flex to occupy width-->
    <div class="grid grid-rows-2 grid-flow-col md:flex md:flex-col gap-0.5">
        <div class="flex flex-col" v-for="value, key in palette.colors" :key="key">
            <Btn class='h-5 min-h-0 shadow-md'
                :tooltip="'Select color ' + value"
                @click="pickColor(key)"
                :style="{ 'backgroundColor': key, 'border': (currentColor === key ? '3px solid black' : '0px solid black') }"
                >
            </Btn>
        </div>
    </div>
    <div class="mx-1 md:mx-0 md:my-1 flex md:flex-col gap-0.5">
        <Btn @click="registerNewColor" tooltip="Add a new color to the curret palette.">New Color</Btn>
        <Btn @click="pushModal(ColorManager)" tooltip="Manage the color palette. Replace or delete colors.">Manage</Btn>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../../builder/inputs/InputStore';
import { palettesMgr } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';

import { defineComponent, toRef } from 'vue'
export default defineComponent({
    data() {
        return {
            currentColor: toRef(inputStore, 'currentColor'),
        }
    },
    computed: {
        palette() {
            return palettesMgr.getCurrent();
        }
    },
    inject:["messages"],
    methods:
    {
        pushModal,
        async registerNewColor(): Promise<void> {
            let result = await pushModal(ColorPicker, { color: this.currentColor }) as [string, string];
            if (!result)
                return;
            let [hex, name] = result;
            if (!this.palette.addColor(hex, name))
            {
                this.messages.pushMessage("Error while picking color: color " + hex + " already exists.");
                return await this.registerNewColor();
            }
            this.currentColor = hex;
        },
        pickColor : function(key: string) {
            this.currentColor = key;
        },
    }
})
</script>

<style scoped>
</style>
