<script setup lang="ts">
import { main, orbitControls, render, unmount } from '../../builder/graphics/Builder';

import { builderInputFsm } from '../../builder/inputs/BuilderInput';
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent, onBeforeUnmount } from 'vue';
import { resetInputComplete } from '@/builder/inputs/InputLoading';

import type { HotkeyManager, HotkeyData, HotkeyHandle } from '@/Hotkeys';
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { useBuilder } from './BuilderComposable';

const { currentSet } = useBuilder();

const hotkeyMgr = inject<HotkeyManager>('hotkeyMgr')!;

const setup = ref(false);
const lastScreen = ref(Date.now() - 2300);

const canvas = ref(null as unknown as HTMLCanvasElement);

onMounted(async () => {
    await main(canvas.value);
    builderInputFsm.initialize(
        canvas.value ,
        orbitControls.controls,
        inputStore,
        hotkeyMgr,
    );
    setup.value = true;
    frame();
});

onBeforeUnmount(async () => {
    await unmount();
    resetInputComplete();
    setup.value = false;
});

const frame = () => {
    if (!setup.value)
        return;
    render();
    if (Date.now() - lastScreen.value > 2500 && currentSet.value) {
        window.localStorage.setItem('set_preview_' + currentSet.value.id, canvas.value.toDataURL('image/jpeg'));
        lastScreen.value = Date.now();
    }
    builderInputFsm.onFrame();
    requestAnimationFrame(() => frame());
};
const onPointerMove = async (event: PointerEvent) => {
    await builderInputFsm.onPointerMove(event);
};
const onPointerDown = async (event: PointerEvent) => {
    await builderInputFsm.onPointerDown(event);
    if (inputStore.grabFocus)
        canvas.value.setPointerCapture(event.pointerId)
};
const onPointerUp = async (event: PointerEvent) => {
    if (inputStore.grabFocus)
        canvas.value.releasePointerCapture(event.pointerId)
    await builderInputFsm.onPointerUp(event);
};

</script>

<template>
    <div class="absolute w-full h-screen block p-0 m-0">
        <canvas
            class="w-full h-full"
            id="backgroundgl"
            ref="canvas"
            @pointermove="onPointerMove"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"/>
    </div>
</template>
