<script setup lang="ts">
defineProps<{
    title: string;
    text: string;
    buttons: {
        text: string;
        tooltip?: string;
        primary?: boolean;
    }[];
}>();

const emit = defineEmits(['close']);
</script>

<template>
    <Window @close="$emit('close')">
        <template #title>{{ title }}</template>
        <p class="mb-8 whitespace-pre-wrap">{{ text }}</p>
        <div class="flex justify-around">
            <p v-for="(btn, i) of buttons" :key="i">
                <Btn class="min-w-[8rem]" :tooltip="btn.tooltip || undefined" :secondary="!btn.primary" @click="emit('close', i)">{{ btn.text }}</Btn>
            </p>
        </div>
    </Window>
</template>
