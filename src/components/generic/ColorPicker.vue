<template>
    <div ref="parentPicker" class="w-full">
        <div ref="colorPicker"/>
    </div>
</template>

<style scoped></style>

<script lang="ts">
import iro from '@jaames/iro';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            colorPicker: undefined,
        };
    },
    props: ['color'],
    emits: ['colorChange'],
    mounted() {
        this.colorPicker = new iro.ColorPicker(this.$refs.colorPicker, {
            color: this.color,
            layoutDirection: 'vertical',
            handleRadius: 4,
            padding: 4,
            width: 10, // should be lower than the min-size of the parent for resizing.
            layout: [
                {
                    component: iro.ui.Box,
                    options: {
                        boxHeight: 100,
                    },
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: 'hue',
                    },
                },
            ],
        });
        this.colorPicker.on(['color:init', 'color:change'], (col) => this.$emit('colorChange', col.hexString));

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries)
                this.colorPicker.resize(entry.contentRect.width)
        });
        resizeObserver.observe(this.$refs.parentPicker);
    },
    watch: {
        color(nv, ov) {
            if (this.colorPicker && nv.match(/^\#[abcdef0-9]{6}$/i))
                this.colorPicker.setColors([nv]);
        },
    },
});
</script>
