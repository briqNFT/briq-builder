<script setup lang="ts">
import Button from '../../generic/Button.vue'
import ColorPicker from '../modals/ColorPicker.vue';
import ColorManager from '../modals/ColorManager.vue';
</script>

<template>
    <div class="my-1" v-for="value, key in colorMap" :key="key">
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
import { inputStore } from '../../../builder/inputs/InputStore';
import { setModal, setModalAndAwait } from '../../MiddleModal.vue'

import { defineComponent } from 'vue'
export default defineComponent({
    data() {
        return inputStore;
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
            if (hex in inputStore.colorMap)
            {
                this.messages.pushMessage("Error while picking color: color " + hex + " already exists.");
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
