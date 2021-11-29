<script setup lang="ts">
import Button from '../generic/Button.vue'
import BuilderVue from './Builder.vue'
</script>

<template>
    <div class="my-2" v-for="value, key in colorMap" :key="key">
        <Button class ='tile'
            @click="pickColor(key)"
            :style="{ 'backgroundColor': value.color, 'border': (currentColor === key ? '4px solid black' : '') }"
            >{{ value.name }}
            </Button>
    </div>
</template>

<script lang="ts">
import { dispatchBuilderAction } from '../../builder/graphics/dispatch'

import { ref, reactive } from 'vue';
export const currentColor = ref("gray");
export const colorMap = reactive({
    "gray": {
        name: "Gray",
        color: "#999999",
    },
    "red": {
        name: "Red",
        color: "#DD0000",
    },
    "blue": {
        name: "Blue",
        color: "#0000DD",
    },
    "green": {
        name: "Green",
        color: "#00DD00",
    },
});

import { defineComponent } from 'vue'
export default defineComponent({
    data() {
        return {
            colorMap,
            currentColor
        }
    },
    methods:
    {
        pickColor : function(key: string) {
            this.currentColor = key;
        },
    }
})
</script>

<style scoped>
</style>
