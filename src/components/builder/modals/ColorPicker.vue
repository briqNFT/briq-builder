<script setup lang="ts">
</script>

<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Color Picker</h2>
            <div class="flex justify-stretch flex-col w-min font-medium">
                <p class="inline-block flex justify-between">Hue:
                    <input class="mx-2" v-model="hue" type="range" min="0" max="3600"/></p>
                <p class="inline-block flex justify-between">Saturation:
                    <input class="mx-2" v-model="saturation" type="range" min="0" max="1000"/></p>
                <p class="inline-block flex justify-between">Luminance:
                    <input class="mx-2" v-model="luminance" type="range" min="0" max="1000"/></p>
                <p class="inline-block flex my-2"><div class="h-8 w-16 rounded-md" :style="{ 'backgroundColor': getHSL()}"></div>
                    <input class="mx-2" v-model="name" type="text" maxlength="7"/></p>
            </div>
            <Btn class="float-right" @click="pickColor">Pick</Btn>
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
            saturation: 700,
            luminance: 700,
            customName: ""
        }
    },
    props: ["metadata"],
    mounted() {
        if (!(this.metadata?.color))
            return;
        this.parse(this.metadata.color);
    },
    methods: {
        parse(colorHex: string)
        {
            let col: THREE.HSL = { h: 0, s: 0, l: 0 };
            let c = new THREE.Color(colorHex);
            c.getHSL(col);
            this.hue = Math.round(col.h * 3600.0);
            this.saturation = Math.round(col.s * 1000);
            this.luminance = Math.round(col.l * 1000);
        },
        getHSL: function(round = false)
        {
            return `hsl(${Math.round(this.hue/10.0)}, ${Math.round(this.saturation/10.0)}%, ${Math.round(this.luminance/10.0)}%)`;
        },
        getHex() {
            return "#" + new THREE.Color(0).offsetHSL(this.hue/3600.0, this.saturation/1000.0, this.luminance / 1000.0).getHexString();
        },
        pickColor: function() {
            let hex = this.getHex();
            this.$emit('close', [hex, hex]);
        }
    },
    computed: {
        name: {
            get() {
                return this.customName ? this.customName : this.getHex();
            },
            set(x) {
                if (x.match(/^\#[abcdef0-9]{6}$/i))
                {
                    this.parse(x);
                    this.customName = "";
                }
                else
                    this.customName = x;
            },
        },
    }
})</script>