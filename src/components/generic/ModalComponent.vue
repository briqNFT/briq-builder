<script setup lang="ts">
defineProps<{
    title: string,
    component: any,
    size?: string,
}>();
defineEmits(['close'])
</script>

<template>
    <Window :size="size" @close="$emit('close')">
        <template #title>{{ title }}</template>
        <component :is="component"/>
    </Window>
</template>
