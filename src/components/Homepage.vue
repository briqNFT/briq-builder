<template>
    <canvas id="backgroundgl" ref="canvas" v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp">
    </canvas>
</template>

<script lang="ts">
import { builderInputFsm, main } from "../builder/graphics/builder.js"

import { PlacerInput } from '../builder/inputs/Placer'

import { defineComponent } from 'vue';
export default defineComponent({
    async mounted() {
        main(this.$refs.canvas);
        builderInputFsm.switchTo(new PlacerInput(this.$refs.canvas));
    },
    methods: {
        onPointerMove: function(event) {
            builderInputFsm.onPointerMove(event);
        },
        onPointerDown: function(event) {
            builderInputFsm.onPointerDown(event);
        },
        onPointerUp: function(event) {
            builderInputFsm.onPointerUp(event);
        }
    }
});
</script>

<style scoped>
#backgroundgl {
  width: 100%;
  height: 100vh;
  display: block;
  padding:0;
  margin:0;
}
</style>
