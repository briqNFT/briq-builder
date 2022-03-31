<script setup lang="ts">
</script>

<template>
    <div class="md:w-3/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Color Picker</h2>
            <div class="flex justify-stretch items-center flex-col w-full font-medium pt-8">
                <ColorPicker :color="color || metadata?.color" @colorChange="(col) => { color = col; }"/>
                <p class="flex justify-center gap-2 my-4">
                    <span class="inline-block w-20 h-8 rounded-md border-2 border-white" :style="{ backgroundColor: color }"></span>
                    <input class="text-center" type="text" maxlength="7" size="7" v-model="color">
                </p>
            </div>
            <Btn class="float-right" @click="pickColor">Pick</Btn>
        </div>
    </div>
</template>

<script lang="ts">
import ColorPicker from '../../generic/ColorPicker.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            color: undefined as undefined | string
        }
    },
    components: { ColorPicker },
    props: ["metadata"],
    mounted() {
        if (!(this.metadata?.color))
            return;
        this.color = this.metadata?.color;
    },
    methods: {
        pickColor()
        {
            this.$emit('close', [this.color, this.color]);
        }
    },
    computed: {
    }
})</script>