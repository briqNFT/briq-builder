<script setup lang="ts">
import { computed, onMounted } from 'vue';
import Flyout from './generic/Flyout.vue';

const emit = defineEmits(['close']);

const props = defineProps<{
    type: 'info' | 'warning' | 'success' | 'error',
}>();

const icon = computed(() => ({
    'info': 'fa-solid fa-clock',
    'warning': 'fa-solid fa-circle-exclamation',
    'success': 'fa-solid fa-circle-check',
    'error': 'fa-solid fa-circle-xmark',
}[props.type]));

onMounted(() => {
    setTimeout(() => emit('close'), 5000)
});

</script>

<style scoped>
.showOnHover {
    @apply transition-all;
}
#app .flyout:not(:hover) .showOnHover {
    @apply hidden;
}

@keyframes fillbar { from { width: 0%; } to { width:100%; }  }

.progressBar {
    animation: fillbar 5s 1 ease-out;
}
</style>

<template>
    <Flyout class="p-4 flyout text-sm">
        <div>
            <div class="flex justify-between items-center pb-1">
                <h4 class="font-medium py-1"><i :style="{ color: `rgb(var(--color-info-${type}))` }" :class="icon"/><slot name="title"/></h4>
                <button
                    @click="$emit('close')"
                    class="p-1 text-xs showOnHover inline-flex justify-center items-center">
                    <i class="fas fa-times"/>
                </button>
            </div>

            <slot/>
            <div class="absolute progressBar bottom-0 left-0 w-full h-[0.25rem]" :style="{ background: `rgb(var(--color-info-${type}))` }"/>
        </div>
    </flyout>
</template>