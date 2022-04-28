<script setup lang="ts">
import Place from './inputs/Place.vue';
import Erase from './inputs/Erase.vue';
import Inspect from './inputs/Inspect.vue';
import Camera from './inputs/Camera.vue';
</script>

<template>
    <component :is="mapping[inputComp]"/>
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
                // Camera shows nothing on purpose.
                // Empty neither
            }),
        };
    },
});
</script>

<style scoped></style>
