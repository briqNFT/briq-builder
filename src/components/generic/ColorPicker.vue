<template>
    <div ref="colorPicker" class="iro"></div>
</template>

<style scoped>
</style>

<script lang="ts">
import iro from '@jaames/iro';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            colorPicker: undefined,
        }
    },
    props: ["color"],
    emits: ["colorChange"],
    mounted()
    {
        this.colorPicker = new iro.ColorPicker(this.$refs.colorPicker, {
            color: this.color,
            layoutDirection: "horizontal",
            layout: [
                {
                    component: iro.ui.Box,
                    options: {
                        borderWidth: 4,
                        width: 200,
                    }
                },
                {
                    component: iro.ui.Wheel,
                    options: {
                        borderWidth: 4,
                        width: 200,
                    }
                },
            ]
        });
        this.colorPicker.on(['color:init', 'color:change'], col => this.$emit('colorChange', col.hexString));
    },
    watch: {
        color(nv, ov) {
            if (this.colorPicker && nv.match(/^\#[abcdef0-9]{6}$/i))
                this.colorPicker.setColors([nv]);
        }
    }
})

</script>