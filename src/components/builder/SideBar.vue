<script setup lang="ts">
import { useBuilderInput } from './InputComposable';
import QuickPicker from './inputs/QuickPicker.vue';
import CameraFlyout from './CameraFlyout.vue';
import Flyout from '../generic/Flyout.vue';
import { usePresetHelpers } from './inputs/CameraComposable';
import Toggle from '../generic/Toggle.vue';

const { activeInputButton, fsm } =  useBuilderInput();

const {
    canCenterCamera,
    centerCamera,
} = usePresetHelpers();

const { inputStore } = useBuilderInput();
</script>

<template>
    <div class="mx-4 mt-1 w-max">
        <QuickPicker v-if="activeInputButton === 'place'"/>
        <CameraFlyout v-if="activeInputButton === 'camera'"/>
        <Flyout
            v-if="activeInputButton === 'select'"
            class="border border-grad-light !shadow-none !text-sm">
            <div class="bg-grad-lighter p-4 rounded-t">
                <h4 class="font-medium">Selection mode</h4>
            </div>
            <div class="p-2 flex flex-col">
                <p class="px-2 py-2 flex justify-between items-center gap-2">Movement gizmo <Toggle class="w-9" v-model="inputStore.showMoveGizmo"/></p>
                <p class="px-2 py-2 flex justify-between items-center gap-2">Rotation gizmo <Toggle class="w-9" v-model="inputStore.showRotateGizmo"/></p>
                <Btn no-background :disabled="!canCenterCamera" @click="centerCamera" class="p-2 justify-start !text-sm">Center on selection</Btn>
            </div>
        </Flyout>
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
