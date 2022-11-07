<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Flyout from './generic/Flyout.vue';

const emit = defineEmits(['close']);

const props = defineProps<{
    level: 'info' | 'warning' | 'success' | 'error',
}>();

const icon = computed(() => ({
    'info': 'far fa-clock',
    'warning': 'far fa-circle-exclamation',
    'success': 'far fa-circle-check',
    'error': 'far fa-circle-xmark',
}[props.level]));

let timeout: any;
let timeoutTime: number;
onMounted(() => {
    timeout = setTimeout(() => emit('close'), 8000);
    timeoutTime = Date.now();
});

const pauseTimer = () => {
    if (timeout)
        clearTimeout(timeout);
    timeoutTime = Date.now() - timeoutTime;
};
const resumeTimer = () => {
    timeout = setTimeout(() => emit('close'), 8000 - timeoutTime);
    timeoutTime = Date.now();
};
</script>

<style scoped>
.showOnHover {
    @apply transition-all;
}
#app .flyout:not(:hover) .showOnHover {
    @apply invisible;
}

@keyframes fillbar { from { width: 0%; } to { width:100%; }  }

.progressBar {
    animation: fillbar 8s 1 ease-out;
}
.flyout:hover .progressBar {
    animation-play-state: paused;
}
</style>

<template>
    <Flyout class="p-4 flyout text-sm overflow-hidden min-w-[11rem]" @pointerenter="pauseTimer" @pointerleave="resumeTimer">
        <div>
            <div class="flex justify-between items-center pb-1">
                <h5 class="font-medium py-1 flex items-center gap-2"><i :style="{ color: `rgb(var(--color-info-${level}))` }" :class="`text-md ${icon}`"/> <slot name="title"/></h5>
                <button
                    @click="$emit('close')"
                    class="p-1 ml-2 w-4 h-4 text-sm showOnHover inline-flex justify-center items-center">
                    <i class="far fa-xmark"/>
                </button>
            </div>

            <slot/>
            <div class="absolute progressBar bottom-0 left-0 w-full h-[0.25rem]" :style="{ background: `rgb(var(--color-info-${level}))` }"/>
        </div>
    </flyout>
</template>
