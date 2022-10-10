<template>
    <div class="absolute w-full h-screen block p-0 m-0">
        <canvas
            class="w-full h-full"
            id="backgroundgl"
            ref="canvas"
            @pointermove="onPointerMove"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"/>
        <div
            :class="'fixed top-0 left-0 h-screen w-screen' + (fsmGrabsFocus ? '' : ' hidden')"
            style="z-index: 10000"
            @pointermove="onPointerMove"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"/>
    </div>
</template>

<script lang="ts">
import { main, orbitControls, render, unmount } from '../../builder/graphics/Builder';

import { builderInputFsm } from '../../builder/inputs/BuilderInput';
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent } from 'vue';
import { resetInputComplete } from '@/builder/inputs/InputLoading';
export default defineComponent({
    inject: ['hotkeyMgr'],
    data() {
        return {
            setup: false,
        };
    },
    async mounted() {
        await main(this.$refs.canvas);
        builderInputFsm.initialize(
            this.$refs.canvas as HTMLCanvasElement,
            orbitControls.controls,
            inputStore,
            this.hotkeyMgr,
        );
        this.setup = true;
        this.frame();
    },
    async beforeUnmount() {
        await unmount();
        resetInputComplete();
        this.setup = false;
    },
    computed: {
        fsmGrabsFocus() {
            return inputStore.grabFocus;
        },
    },
    methods: {
        frame() {
            if (!this.setup)
                return;
            render();
            builderInputFsm.onFrame();
            requestAnimationFrame(() => this.frame());
        },
        onPointerMove: async function (event) {
            await builderInputFsm.onPointerMove(event);
        },
        onPointerDown: async function (event) {
            await builderInputFsm.onPointerDown(event);
        },
        onPointerUp: async function (event) {
            await builderInputFsm.onPointerUp(event);
        },
    },
});
</script>
