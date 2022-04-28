<template>
    <Window>
        <template #big-title>
            <span><span class="briq-logo">briq</span> browser</span>
        </template>
        <div class="browser grid grid-cols-2 gap-1">
            <Btn @click="setMaterial('0x1')" :class="currentMat === '0x1' && 'active'">Regular material</Btn>
            <Btn @click="setMaterial('0x3')" :class="currentMat === '0x3' && 'active'">Limited material</Btn>
            <Btn @click="setMaterial('0x4')" :class="currentMat === '0x4' && 'active'">Rare material</Btn>
            <Btn @click="setMaterial('0x5')" :class="currentMat === '0x5' && 'active'">Ultra-rare material</Btn>
        </div>
    </Window>
</template>

<style scoped>
.browser > button {
    @apply h-20;
}
.active {
    @apply bg-accent;
}
</style>

<script lang="ts">
import { inputStore } from '@/builder/inputs/InputStore';

import { defineComponent } from 'vue';
export default defineComponent({
    computed: {
        currentMat() {
            return inputStore.currentMaterial;
        },
    },
    methods: {
        setMaterial(mat: string) {
            inputStore.currentMaterial = mat;
        },
    },
});
</script>
