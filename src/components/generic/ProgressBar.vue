<script setup lang="ts">
defineProps<{
    percentage: number
}>();
</script>

<style scoped>
.progress-bar::after {
    content: '';
    @apply absolute left-0 top-0 w-full h-full bg-info-error rounded-l bg-white bg-opacity-50;
    clip-path: inset(0 0 70% 0);
}
.done {
    @apply !rounded;
}
</style>

<template>
    <div class="inline-block my-2 h-2 w-full relative bg-grad-lighter rounded">
        <div :class="`inline-block progress-bar absolute left-0 top-0 h-full bg-info-warning rounded-l ${percentage >= 100 ? 'done' : ''}`" :style="{ width: `${percentage}%`}"/>
    </div>
</template>
