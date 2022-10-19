<template>
    <Window @close="$emit('close')">
        <template #title>{{ metadata.title }}</template>
        <p class="mb-8">{{ metadata.text }}</p>
        <div class="flex justify-around">
            <p v-for="(btn, i) of metadata.buttons">
                <Btn class="min-w-[8rem]" :tooltip="btn.tooltip || undefined" :secondary="!btn.primary" @click="$emit('close', i)">{{ btn.text }}</Btn>
            </p>
        </div>
    </Window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    props: ['metadata'],
    emits: ['close'],
});
</script>
