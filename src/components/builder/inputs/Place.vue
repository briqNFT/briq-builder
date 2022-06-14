<script setup lang="ts">
import QuickPicker from './QuickPicker.vue';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { computed } from 'vue';

import { THREE } from '@/three';
import { camera } from '@/builder/graphics/Builder';

const fsm = computed(() => builderInputFsm.gui);

const unproject = (n: { x: number, y: number, z: number }) => {
    const pos = (new THREE.Vector3(n.x, n.y, n.z)).project(camera);
    return [(pos.x + 1) / 2, 1.0 - (pos.y + 1) / 2];
}
</script>

<template>
    <QuickPicker/>
    <!-- Follows the mouse -->
    <div
        v-if="fsm && !!fsm.curX && !!fsm.range && builderInputFsm.store.currentInput.indexOf('place') !== -1"
        class="fixed pointer-events-none select-none"
        :style="{ left: `${fsm?.curX + 20}px`, top: `${fsm?.curY + 20}px` }">
        <div class="w-auto bg-base p-2 rounded shadow-md">
            <p>
                {{ (Math.abs(fsm.range.x) + 1) * (Math.abs(fsm.range.y) + 1) * (Math.abs(fsm.range.z) + 1) }} briqs
            </p>
        </div>
    </div>
    <div
        v-if="fsm?.infoX && fsm.range.x !== 0"
        class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
        :style="{ left: `${unproject(fsm.infoX)[0]*100}%`, top: `${unproject(fsm.infoX)[1]*100}%` }">
        <div class="bg-base rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.x) + 1 }}</div>
    </div>
    <div
        v-if="fsm?.infoY && fsm.range.y !== 0"
        class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
        :style="{ left: `${unproject(fsm.infoY)[0]*100}%`, top: `${unproject(fsm.infoY)[1]*100}%` }">
        <div class="bg-base rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.y) + 1 }}</div>
    </div>
    <div
        v-if="fsm?.infoZ && fsm.range.z !== 0"
        class="fixed text-[2rem] flex justify-center items-center leading-[2.1rem] font-bold font-mono select-none"
        :style="{ left: `${unproject(fsm.infoZ)[0]*100}%`, top: `${unproject(fsm.infoZ)[1]*100}%` }">
        <div class="bg-base rounded px-2 pb-[0.2rem]" style="transform: translate(-50%, -50%);">{{ Math.abs(fsm.range.z) + 1 }}</div>
    </div>
</template>

<style scoped></style>
