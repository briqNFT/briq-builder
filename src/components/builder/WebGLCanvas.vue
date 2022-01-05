<template>
    <canvas id="backgroundgl" ref="canvas" v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp">
    </canvas>
</template>

<script lang="ts">
import { main, orbitControls } from "../../builder/graphics/builder.js"

import { builderInputFsm } from "../../builder/inputs/BuilderInput"
import { inputStore } from '../../builder/inputs/InputStore'

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            currentInput: undefined,
        }
    },
    async mounted() {
        main(this.$refs.canvas);
        this.currentInput = toRef(inputStore, 'currentInput');
        builderInputFsm.initialize(this.$refs.canvas as HTMLCanvasElement, orbitControls.controls, inputStore);
    },
    methods: {
        onPointerMove: async function(event) {
            await builderInputFsm.onPointerMove(event);
        },
        onPointerDown: async function(event) {
            await builderInputFsm.onPointerDown(event);
        },
        onPointerUp: async function(event) {
            await builderInputFsm.onPointerUp(event);
        }
    },
    watch: {
        currentInput: {
            immediate: true,
            handler: function(newV, oldV)
            {
                if (!newV)
                    return;
                builderInputFsm.switchTo(this.currentInput);
            }
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
