<script setup lang="ts">
import Place from './inputs/Place.vue';
import Erase from './inputs/Erase.vue';
import Inspect from './inputs/Inspect.vue';
import Camera from './inputs/Camera.vue';

import { builderInputFsm } from '@/builder/inputs/BuilderInput';

const fsm = builderInputFsm.gui;

</script>

<template>
    <component v-if="!inputStore.hideInput" :is="mapping[inputComp]"/>
    <div v-else=""/>
    <!-- Selection box -->
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

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent, toRef, markRaw } from 'vue';
export default defineComponent({
    data() {
        return {
            inputComp: toRef(inputStore, 'currentInput'),
            mapping: markRaw({
                place: Place,
                place_multi: Place,
                place_nft: Place,
                paint: Place,
                paint_multi: Place,
                erase: Erase,
                erase_multi: Erase,
                inspect: Inspect,
                inspect_va: Inspect,
                inspect_box: Inspect,
                drag: Inspect,
                rotate: Inspect,
                copy_paste: Inspect,
                camera: Camera,
                camera_select: Camera,
                // Empty neither
            }),
        };
    },
});
</script>

<style scoped></style>
