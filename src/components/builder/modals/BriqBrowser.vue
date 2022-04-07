<template>
    <Window>
        <template #big-title><span><span class="briq-logo">briq</span> browser</span></template>
        <div class="browser grid grid-cols-2 gap-1">
            <div @click="setMaterial('0x1')">Regular material</div>
            <div @click="setMaterial('0x3')">Limited material</div>
            <div @click="setMaterial('0x4')">Rare material</div>
            <div @click="setMaterial('0x5')">Ultra-rare material</div>
        </div>
    </Window>
</template>

<style scoped>
.browser > div {
    @apply h-20 bg-accent p-2 text-center
}
</style>

<script lang="ts">
import { inputStore } from '@/builder/inputs/InputStore';

import { defineComponent } from 'vue';
export default defineComponent({
    methods: {
        setMaterial(mat: string) {
            inputStore.currentMaterial = mat;
        }
    }
});

</script>
