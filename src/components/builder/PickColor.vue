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
        <Button @click="setModal(ColorPicker)">New</Button>
        <Button @click="setModal(ColorManager)">Manage</Button>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';
import { setModal } from '../MiddleModal.vue'

import { defineComponent } from 'vue'
export default defineComponent({
    data() {
        return inputStore;
    },
    methods:
    {
        setModal,
        pickColor : function(key: string) {
            this.currentColor = key;
        },
    }
})
</script>

<style scoped>
</style>
