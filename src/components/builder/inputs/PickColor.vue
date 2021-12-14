<script setup lang="ts">
import Button from '../../generic/Button.vue'
import ColorPicker from '../modals/ColorPicker.vue';
import ColorManager from '../modals/ColorManager.vue';
</script>

<template>
    <!-- Flex to occupy width-->
    <div class="grid grid-rows-2 grid-flow-col md:flex md:flex-col gap-0.5">
        <div class="flex flex-col" v-for="value, key in palette.colors" :key="key">
            <Button class='h-5 min-h-0 shadow-md'
                :tooltip="'Select color ' + value"
                @click="pickColor(key)"
                :style="{ 'backgroundColor': key, 'border': (currentColor === key ? '3px solid black' : '0px solid black') }"
                >
            </Button>
        </div>
    </div>
    <div class="mx-1 md:mx-0 md:my-1 flex md:flex-col gap-0.5">
        <Button @click="registerNewColor" tooltip="Add a new color to the curret palette.">New Color</Button>
        <Button @click="setModal(ColorManager)" tooltip="Manage the color palette. Replace or delete colors.">Manage</Button>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../../builder/inputs/InputStore';
import { palettesMgr } from '../../../builder/Palette';
import { setModal, setModalAndAwait } from '../../MiddleModal.vue'

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
        setModal,
        async registerNewColor(): Promise<void> {
            let result = await setModalAndAwait(ColorPicker, { color: this.currentColor });
            if (!result)
            {
                setModal();
                return;
            }
            let [hex, name] = result;
            if (!this.palette.addColor(hex, name))
            {
                this.messages.pushMessage("Error while picking color: color " + hex + " already exists.");
                setModal();
                return await this.registerNewColor();
            }
            this.currentColor = hex;
            setModal();
        },
        pickColor : function(key: string) {
            this.currentColor = key;
        },
    }
})
</script>

<style scoped>
</style>
