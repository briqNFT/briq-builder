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
    icon?: boolean,
    forceActive?: boolean
}>();

</script>

<template>
    <Tooltip :tooltip="tooltip">
        <button
            v-bind="$attrs"
            :class="[noStyle ? 'nostyle' : '',
                     noStyle || noBackground ? '' : 'btn',
                     secondary ? 'secondary' : '',
                     icon ? 'icon' : '',
                     forceActive ? 'forceActive' : ''].join(' ')">
            <slot/>
        </button>
    </Tooltip>
</template>

<style>
#app button {
    z-index: 0;
    @apply inline-flex justify-center items-center;
    @apply px-2 md:px-3 py-2 md:py-3;
    @apply text-sm md:text-md font-normal leading-none;
    @apply select-none;
    @apply relative;
}

#app button.icon > i, #app button.icon > svg {
    @apply w-6 pr-1 inline-flex justify-center items-baseline;
}

/* No background design */
#app button:not(.btn):not(.nostyle) {
    @apply text-text-on-background;
}

#app button:not(.btn):not(.nostyle):not(:disabled):active, #app button:not(.btn):not(.nostyle):not(:disabled).forceActive {
    @apply text-primary;
}

#app button:not(.btn):not(.nostyle)::before {
    content: '';
    z-index: -1;
    @apply w-full h-full absolute top-0 left-0;
    @apply rounded-sm;
}

#app button:not(.btn):not(.nostyle):not(:disabled):hover::before {
    @apply bg-grad-lighter;
}

#app button:not(.btn):not(.nostyle):not(:disabled):active::before {
    @apply bg-grad-lighter;
}

#app button:not(.btn):not(.nostyle):disabled {
    @apply text-grad-darker;
}


/* Primary design */
#app .btn {
    @apply text-text-on-primary;
    @apply h-[2rem] md:h-[2.5rem];
    @apply px-1 md:px-3 py-2 md:py-4;
}

/* Use a pseudo-element to avoid the layout changing when the size changes */
#app .btn::before {
    content: '';
    z-index: -1;
    @apply w-full h-full absolute top-0 left-0;
    @apply bg-primary border border-grad-darker rounded;
}

#app .btn:not(:disabled):hover::before {
    @apply bg-primary-lighter;
}

#app .btn:not(:disabled):active::before {
    /* 2px on either side */
    @apply w-[calc(100%-0.125rem)] h-[calc(100%-0.125rem)] top-[0.0625rem] left-[0.0625rem];
    @apply bg-primary-lighter;
}

#app .btn:disabled::before {
    @apply bg-primary-lightest;
}

/* Secondary button design */
#app .btn.secondary {
    @apply text-text-on-background;
}

#app .btn.secondary::before {
    @apply bg-grad-lightest border-grad-light;
}

#app .btn.secondary:not(:disabled):hover::before {
    @apply bg-grad-lighter;
}

#app .btn.secondary:not(:disabled):active::before {
    @apply bg-grad-lighter;
}

#app .btn.secondary:disabled::before {
    @apply bg-grad-lightest;
}

#app .btn.secondary:disabled {
    --tw-text-opacity: 0.5;
}

</style>
