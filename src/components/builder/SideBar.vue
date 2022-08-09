<script setup lang="ts">
import { useBuilderInput } from './InputComposable';
import QuickPicker from './inputs/QuickPicker.vue';

const { activeInputButton, fsm } =  useBuilderInput();
</script>

<template>
    <div class="mx-4 mt-1 w-max">
        <QuickPicker v-if="activeInputButton === 'place'"/>
    </div>
    <div
        v-if="fsm.selectionBox"
        class="bg-opacity-50 bg-white border-2 border-solid border-black fixed pointer-events-none"
        :style="{
            left: `${Math.min(fsm.curX, fsm.startX)}px`,
            top: `${Math.min(fsm.curY, fsm.startY)}px`,
            width: `${Math.abs(fsm.curX - fsm.startX)}px`,
            height: `${Math.abs(fsm.curY - fsm.startY)}px`,
        }"/>
</template>
