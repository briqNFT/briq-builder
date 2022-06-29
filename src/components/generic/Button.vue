<script setup lang="ts">
/**
 * A generic Button component that can automatically set a tooltip.
 */
import Tooltip from './Tooltip.vue';

defineProps<{
    tooltip?: string,
    secondary?: boolean,
    noStyle?: boolean,
    noBackground?: boolean,
    icon?: boolean
}>();

</script>

<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="[noStyle || noBackground ? '' : 'btn', secondary ? 'secondary' : '', icon ? 'icon' : ''].join(' ')"><slot/></button>
    </Tooltip>
</template>

<style>
html.v2design button {
    z-index: 1;
    @apply text-left;
    @apply px-2 py-3;
    @apply text-md font-normal leading-none;
    @apply min-h-[1.5rem];
    @apply select-none;
    @apply relative;
}

/* Use a pseudo-element to avoid the layout changing when the size changes */
html.v2design button::before {
    content: '';
    z-index: -1;
    @apply w-full h-full absolute top-0 left-0;
}

html.v2design button:not(:disabled):active::before {
    @apply w-[calc(100%-0.25rem)] h-[calc(100%-0.25rem)] top-0.5 left-0.5;
}


html.v2design button.icon i {
    @apply w-6 pr-1 inline-flex justify-center items-baseline;
}

/* Primary design */
html.v2design .btn {
    @apply text-text-on-accent;
    @apply min-h-[2.5rem];
    @apply px-4 py-4;
}

html.v2design .btn::before {
    @apply bg-accent border border-dark rounded-md;
}

html.v2design .btn:not(:disabled):hover::before {
    @apply bg-accent-secondary;
}

html.v2design .btn:not(:disabled):active::before {
    @apply bg-accent-secondary;
}

html.v2design .btn:disabled::before {
    @apply bg-light-accent border-darkest;
}

/* Secondary button design */
html.v2design .btn.secondary {
    @apply text-text;
}

html.v2design .btn.secondary::before {
    @apply bg-base border-darkest;
}

html.v2design .btn.secondary:not(:disabled):hover::before {
    @apply bg-darker;
}

html.v2design .btn.secondary:not(:disabled):active::before {
    @apply bg-darker;
}

html.v2design .btn.secondary:disabled::before {
    @apply bg-darker;
}

html.v2design .btn.secondary:disabled {
    @apply text-darker;
}


/* No background design */
html.v2design button:not(.btn) {
    @apply text-text;
}

html.v2design button:not(.btn)::before {
    @apply rounded-sm;
}

html.v2design button:not(.btn):not(:disabled):hover::before {
    @apply bg-darker;
}

html.v2design button:not(.btn):not(:disabled):active::before {
    @apply bg-darker;
}

html.v2design button:not(.btn):disabled {
    @apply text-darkest;
}


/** BUILDER SETTINGS */

html:not(.v2design) .btn {
    @apply bg-base rounded-sm px-3 py-1;
    @apply border-base border-2;
    @apply shadow-sm;
    @apply font-extralight leading-none tracking-tight;
    min-height: 2.5rem;
    @apply select-none;
}
html:not(.v2design) .btn:not(:disabled):hover {
    @apply border-b-2 border-deep-blue;
}
html:not(.v2design) .btn:not(:disabled):active {
    @apply border-2 border-deep-blue bg-accent;
}
html:not(.v2design) .btn:disabled {
    @apply bg-gray-300 dark:bg-gray-700;
    @apply text-gray-600 dark:text-gray-500 dark:border-black;
}

html:not(.v2design) .alternate-buttons .btn {
    @apply font-medium border-text rounded border-4 px-1;
}
html:not(.v2design) .alternate-buttons .btn:not(:disabled):hover {
    @apply border-4 border-deep-blue;
}
html:not(.v2design) .alternate-buttons .btn:not(:disabled):active {
    @apply border-4 bg-accent;
}

html:not(.v2design) .alternate-buttons .btn:disabled {
    @apply dark:border-black;
}
</style>
