<script setup lang="ts">
import { useBuilderInput } from './InputComposable';
import QuickPicker from './inputs/QuickPicker.vue';
import CameraFlyout from './CameraFlyout.vue';
import Flyout from '../generic/Flyout.vue';
import { usePresetHelpers } from './inputs/CameraComposable';
import Toggle from '../generic/Toggle.vue';

import { THREE } from '@/three';
import { camera } from '@/builder/graphics/Builder';


const { inputStore, activeInputButton, fsm } =  useBuilderInput();

const {
    canCenterCamera,
    centerCamera,
} = usePresetHelpers();

const unproject = (n: { x: number, y: number, z: number }) => {
    const pos = (new THREE.Vector3(n.x, n.y, n.z)).project(camera);
    return [(pos.x + 1) / 2, 1.0 - (pos.y + 1) / 2];
}

</script>

<template>
    <div class="mx-1 sm:mx-2 mt-1 sm:mt-2 w-max absolute bottom-2 sm:static" id="sidebar">
        <QuickPicker v-if="activeInputButton !== 'camera' && activeInputButton !== 'erase'"/>
        <CameraFlyout v-if="activeInputButton === 'camera'"/>
        <Flyout
            v-if="activeInputButton === 'select'"
            class="border border-grad-light !shadow-none !text-sm mt-2">
            <div class="bg-background px-4 py-3 rounded-t">
                <h4 class="font-semibold text-sm leading-figma">Selection tool</h4>
            </div>
            <div class="p-2 flex flex-col select-none">
                <p class="px-2 py-2 flex justify-between items-center gap-2">briqs selected<span class="font-medium select-text flex-1 text-right">{{ inputStore.selectionMgr.selectedBriqs.length }}</span></p>
                <p class="px-2 py-2 flex justify-between items-center gap-2">Movement gizmo <Toggle class="w-9" v-model="inputStore.showMoveGizmo"/></p>
                <p class="px-2 py-2 flex justify-between items-center gap-2">Rotation gizmo <Toggle class="w-9" v-model="inputStore.showRotateGizmo"/></p>
                <Btn no-background :disabled="!canCenterCamera" @click="centerCamera" class="p-2 py-3 justify-start !text-sm">Center on selection</Btn>
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
    <div class="pointer-events-none">
        <!-- Follows the mouse -->
        <div
            v-if="fsm && !!fsm.curX && !!fsm.range && inputStore.currentInput.indexOf('place') !== -1"
            class="fixed pointer-events-none select-none"
            :style="{ left: `${fsm?.curX + 20}px`, top: `${fsm?.curY + 20}px` }">
            <div class="w-auto bg-grad-lightest p-2 rounded shadow-md">
                <p>
                    {{ (Math.abs(fsm.range.x) + 1) * (Math.abs(fsm.range.y) + 1) * (Math.abs(fsm.range.z) + 1) }} briqs
                </p>
            </div>
        </div>
        <div
            v-if="fsm?.infoX && fsm.range.x !== 0"
            class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
            :style="{ left: `${unproject(fsm.infoX)[0]*100}%`, top: `${unproject(fsm.infoX)[1]*100}%` }">
            <div class="bg-grad-lightest rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.x) + 1 }}</div>
        </div>
        <div
            v-if="fsm?.infoY && fsm.range.y !== 0"
            class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
            :style="{ left: `${unproject(fsm.infoY)[0]*100}%`, top: `${unproject(fsm.infoY)[1]*100}%` }">
            <div class="bg-grad-lightest rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.y) + 1 }}</div>
        </div>
        <div
            v-if="fsm?.infoZ && fsm.range.z !== 0"
            class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
            :style="{ left: `${unproject(fsm.infoZ)[0]*100}%`, top: `${unproject(fsm.infoZ)[1]*100}%` }">
            <div class="bg-grad-lightest rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.z) + 1 }}</div>
        </div>
    </div>
</template>
