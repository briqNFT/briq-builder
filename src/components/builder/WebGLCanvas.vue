<template>
    <canvas id="backgroundgl" ref="canvas" v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp">
    </canvas>
    <div :class="'fixed top-0 left-0 h-screen w-screen' + (fsmGrabsFocus ? '' : ' hidden')" style="z-index: 10000;"
     v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp"
    >
    </div>
</template>

<script lang="ts">
import { main, orbitControls, render } from "../../builder/graphics/Builder"

import { builderInputFsm } from "../../builder/inputs/BuilderInput"
import { inputStore } from '../../builder/inputs/InputStore'

import { defineComponent, toRef } from 'vue';
import { logDebug } from "../../Messages";
export default defineComponent({
    inject: ["hotkeyMgr"],
    data() {
        return {
            currentInput: undefined,
            setup: false,
        }
    },
    async mounted() {
        await main(this.$refs.canvas);
        this.currentInput = toRef(inputStore, 'currentInput');
        builderInputFsm.initialize(this.$refs.canvas as HTMLCanvasElement, orbitControls.controls, inputStore, this.hotkeyMgr);
        this.setup = true;
        this.frame();
    },
    computed: {
        fsmGrabsFocus() {
            return inputStore.grabFocus;
        }
    },
    methods: {
        frame() {
            render();
            builderInputFsm.onFrame();
            requestAnimationFrame(() => this.frame());
        },
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
                if (this.setup)
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
