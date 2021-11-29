<script setup lang="ts">
import Button from '../generic/Button.vue'
import ColorPicker from './modals/ColorPicker.vue';
import ColorManager from './modals/ColorManager.vue';
</script>

<template>
    <div class="my-2" v-for="value, key in colorMap" :key="key">
        <Button class ='tile'
            @click="pickColor(key)"
            :style="{ 'backgroundColor': value.color, 'border': (currentColor === key ? '4px solid black' : '') }"
            >{{ value.name }}
        </Button>
    </div>
    <div class="my-2">
        <Button @click="registerNewColor">New</Button>
        <Button @click="setModal(ColorManager)">Manage</Button>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';
import { setModal, setModalAndAwait } from '../MiddleModal.vue'

import { defineComponent } from 'vue'
export default defineComponent({
    data() {
        return inputStore;
    },
    methods:
    {
        setModal,
        async registerNewColor(): Promise<void> {
            let [hex, name] = await setModalAndAwait(ColorPicker);
            if (hex in inputStore.colorMap)
            {
                console.log("fail");
                setModal();
                return await this.registerNewColor();
            }
            inputStore.colorMap[hex] = {
                name: name,
                color: hex,
            };
            inputStore.currentColor = hex;
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
