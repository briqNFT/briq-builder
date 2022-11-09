<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    percentage: number,
    color?: string
}>();

const style = computed(() => {
    let ret = {
        width: `${props.percentage}%`,
    } as any;
    if (props.color)
        ret.backgroundColor = `${props.color} !important`;
    return ret;
});
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
    <div class="inline-block my-2 h-2 w-full relative bg-grad-lighter rounded overflow-hidden">
        <div :style="style" :class="`inline-block progress-bar absolute left-0 top-0 h-full bg-info-warning rounded-l ${percentage >= 100 ? 'done' : ''}`"/>
    </div>
</template>
