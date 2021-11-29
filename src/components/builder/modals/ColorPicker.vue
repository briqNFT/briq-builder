<script setup lang="ts">
import Button from '../../generic/Button.vue';
</script>

<template>
    <div class="w-1/2">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Color Picker</h2>
            <p>Hue: <input v-model="hue" type="range" min="0" max="360"/></p>
            <p>Saturation: <input v-model="saturation" type="range" min="0" max="100"/></p>
            <p>Luminance: <input v-model="luminance" type="range" min="0" max="100"/></p>
            <p class="h-8 w-16" :style="{ 'backgroundColor': getHSL()}"></p>
            <p>Name: <input v-model="name" type="text"/></p>
            <Button class="float-right" @click="pickColor">Pick</Button>
        </div>
    </div>
</template>

<script lang="ts">
import * as THREE from 'three';

import { inputStore } from '../../../builder/inputs/InputStore'

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            hue: 0,
            luminance: 100,
            saturation: 50,
            customName: ""
        }
    },
    methods: {
        getHSL: function()
        {
            return `hsl(${this.hue}, ${this.saturation}%, ${this.luminance}%)`;
        },
        getHex() {
            return "#" + new THREE.Color(this.getHSL()).getHexString();
        },
        pickColor: function() {
            let hex = this.getHex();
            if (hex in inputStore.colorMap)
            {
                console.log("fail");
                return;
            }
            inputStore.colorMap[hex] = {
                name: this.name,
                color: hex,
            };
            inputStore.currentColor = hex;
        }
    },
    computed: {
        name: {
            get() {
                return this.customName ? this.customName : this.getHex();
            },
            set(x) {
                this.customName = x;
            },
        },
    }
})</script>