<template>
    <canvas id="backgroundgl" ref="canvas" v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp">
    </canvas>
</template>

<script lang="ts">
import { main } from "../../builder/graphics/builder.js"

import { builderInputFsm } from "../../builder/graphics/builder.js"
import { inputStore } from '../../builder/inputs/InputStore'
import { inputMap } from '../../builder/inputs/InputMap'

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
    },
    watch: {
        currentInput: {
            immediate: true,
            handler: function(newV, oldV)
            {
                if (!newV)
                    return;
                builderInputFsm.switchTo(new inputMap[this.currentInput](this.$refs.canvas));
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
