<script setup lang="ts">
import Button from '../../generic/Button.vue'
import ColorPicker from '../modals/ColorPicker.vue';
import ColorManager from '../modals/ColorManager.vue';
</script>

<template>
    <div class="my-0.5 flex flex-col" v-for="value, key in palette.colors" :key="key">
        <Button class='h-5 min-h-0'
            :tooltip="'Select color ' + value"
            @click="pickColor(key)"
            :style="{ 'backgroundColor': key, 'border': (currentColor === key ? '4px solid black' : '1px solid black') }"
            >
        </Button>
    </div>
    <div class="my-1 flex flex-col">
        <Button class="my-0.5" @click="registerNewColor">New Color</Button>
        <Button class="my-0.5" @click="setModal(ColorManager)">Manage</Button>
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
            let result = await setModalAndAwait(ColorPicker);
            if (!result)
            {
                setModal();
                return;
            }
            let [hex, name] = result;
            if (hex in this.palette.colors)
            {
                this.messages.pushMessage("Error while picking color: color " + hex + " already exists.");
                setModal();
                return await this.registerNewColor();
            }
            this.palette.colors[hex] = name;
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
