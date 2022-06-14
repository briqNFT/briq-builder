<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="(noStyle ? '' : 'btn')"><slot/></button>
    </Tooltip>
</template>

<style>
html.v2design .btn {
    @apply text-text-on-accent px-4 py-4;
    @apply text-md font-normal leading-none;
    @apply min-h-[2.5rem];
    @apply select-none;
    @apply z-[0];
    @apply relative;
}

/** Move the text so that it looks like it's inside the pseudo-element. */
html.v2design .btn:not(:disabled) {
    @apply translate-y-[0px] translate-x-[0px];
}

html.v2design .btn:not(:disabled):hover {
    @apply translate-y-[-2px] translate-x-[-2px];
}

html.v2design .btn:not(:disabled):active {
    @apply translate-y-[2px] translate-x-[2px];
}

/**
 * Pseudo-element to actually render the button.
 * This makes it so I don't have sizeing problems with overflow,
 * and also prevents the button clickable area from f-ing up.
 */

html.v2design .btn:not(:disabled)::before {
    content: ' ';
    @apply rounded-sm bg-black;
    @apply absolute top-0 left-0 translate-y-[4px] translate-x-[4px] w-[calc(100%_+_-4px)] h-[calc(100%_+_-4px)] z-[-1];
}
html.v2design .btn:not(:disabled):hover::before {
    @apply translate-y-[6px] translate-x-[6px];
}
html.v2design .btn:not(:disabled):active::before {
    @apply translate-y-[2px] translate-x-[2px];
}

html.v2design .btn::after {
    content: ' ';
    @apply w-[calc(100%_+_-4px)] h-[calc(100%_+_-4px)] absolute top-0 left-0;
    @apply bg-accent rounded-sm border border-dark;
    @apply z-[-1];
    @apply translate-y-[2px] translate-x-[2px];
}

html.v2design .btn:disabled::after {
    @apply bg-light-accent rounded-sm bg-light-accent border border-dark;
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
