<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="(noStyle ? '' : 'btn')"><slot/></button>
    </Tooltip>
</template>

<style>
.btn {
    @apply bg-base rounded px-3 py-1;
    @apply border-base border-2;
    @apply shadow-sm;
    @apply font-light leading-none;
    min-height: 2.5rem;
    @apply select-none;
}
.btn:not(:disabled):hover {
    @apply border-b-2 border-deep-blue;
}
.btn:not(:disabled):active {
    @apply border-2 border-deep-blue bg-accent;
}
.btn:disabled {
    @apply bg-gray-300 dark:bg-gray-700;
    @apply text-gray-600 dark:text-gray-500 dark:border-black;
}

.alternate-buttons .btn {
    @apply font-semibold border-text rounded-md border-4 px-1;
}
.alternate-buttons .btn:not(:disabled):hover {
    @apply border-4 border-deep-blue;
}
.alternate-buttons .btn:not(:disabled):active {
    @apply border-4 bg-accent;
}

.alternate-buttons .btn:disabled {
    @apply dark:border-black;
}
</style>

<script lang="ts">
/**
 * A generic Button component that can automatically set a tooltip.
 */
import Tooltip from './Tooltip.vue';
import { defineComponent } from 'vue';
export default defineComponent({
    props: ['tooltip', 'noStyle'],
    components: { Tooltip },
});
</script>
