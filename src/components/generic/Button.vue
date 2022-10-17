<script setup lang="ts">
/**
 * A generic Button component that can automatically set a tooltip.
 */
import { ref } from 'vue';
import Tooltip from './Tooltip.vue';

defineProps<{
    tooltip?: string,
    secondary?: boolean,
    noStyle?: boolean,
    noBackground?: boolean,
    icon?: boolean,
    forceActive?: boolean
}>();

const button = ref(null as unknown as HTMLButtonElement);
defineExpose({
    button,
})

</script>

<template>
    <Tooltip :tooltip="tooltip">
        <button
            ref="button"
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
button {
    z-index: 0;
    @apply inline-flex justify-center items-center;
    @apply px-2 md:px-3 py-2 md:py-3;
    @apply text-sm md:text-md font-medium leading-none;
    @apply select-none;
    @apply relative;

    &.icon > i, &.icon > svg {
        @apply w-4 mr-3 inline-flex justify-center items-baseline;
    }

    /* no-background variant */
    &:not(.btn):not(.nostyle) {
        @apply text-text-on-background;

        &::before {
            content: '';
            z-index: -1;
            @apply w-full h-full absolute top-0 left-0;
            @apply rounded-sm;
        }

        &:not(:disabled) {
            &:active, &.forceActive {
                @apply text-primary;
            }

            &:hover::before {
                @apply bg-grad-lighter;
            }
            &:active::before, &.forceActive::before {
                @apply bg-grad-lighter;
            }
        }

        &:disabled {
            --tw-text-opacity: 0.5;
        }
    }

    &.btn {
        @apply text-text-on-primary;
        @apply h-[2rem] md:h-[2.5rem];
        @apply px-3 md:px-4 py-2 md:py-4;

        /* Primary design */
        /* Use a pseudo-element to avoid the layout changing when the size changes */
        &::before {
            content: '';
            z-index: -1;
            @apply w-full h-full absolute top-0 left-0;
            @apply bg-primary rounded;
        }

        &:not(:disabled) {
            &:hover::before {
                @apply bg-primary-lighter;
            }
            &:active::before, &.forceActive::before {
                /* 2px on either side */
                @apply w-[calc(100%-0.125rem)] h-[calc(100%-0.125rem)] top-[0.0625rem] left-[0.0625rem];
                @apply bg-primary-lighter;
            }
        }

        &:disabled {
            --tw-text-opacity: 0.5;
        }

        &:disabled::before {
            @apply bg-primary-lightest;
        }

        /* Secondary button design */
        &.secondary {
            @apply text-text-on-background;
            &::before {
                @apply bg-grad-lightest border border-grad-light;
            }

            &:not(:disabled) {
                &:hover::before {
                    @apply bg-grad-lighter;
                }
                &:active::before, &.forceActive::before {
                    @apply bg-grad-lighter;
                }
            }
            &:disabled {
                --tw-text-opacity: 0.5;
            }
            &:disabled::before {
                @apply bg-grad-lightest;
            }
        }
    }
}

</style>
