<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="noStyle ? '' : 'btn' + ' custom-checkbox !p-1 flex justify-center items-center gap-1' + (enabled ? ' enabled' : '')" @click="$emit('enable', !enabled);">
            <span class="bg flex items-center p-0.5">

                <span class="w-5 h-5 indicator flex justify-center items-center text-sm"><slot name="icon"></slot></span>
            </span>
            <slot></slot>
        </button>
    </Tooltip>
</template>

<style>
.custom-checkbox .bg {
    width: 100%;
    min-width: 2rem;
    height: 1.5rem;
    @apply bg-gray-300 dark:bg-gray-700;
    border-radius: 3rem;
    transition: all 0.4s;
}

.custom-checkbox.enabled .bg {
    /*background: rgb(0, 150, 250);*/
    @apply bg-accent;
    border-radius: 3.4rem;
}


.custom-checkbox .indicator {
    @apply shadow-md;
    color: black;
    @apply bg-white dark:bg-gray-300;
    border-radius:50%;
    position: relative;
    left: 0;
    transition: all 0.4s;
}

.custom-checkbox.enabled .indicator {
    position: relative;
    left: calc(100% - 1.25rem);
}
</style>

<script lang="ts">
/**
 * A generic Checkbox button component with an automatic tooltip and a status indicator.
 */
import Tooltip from "./Tooltip.vue";
import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
        }
    },
    emits: ["enable"],
    props: ["enabled", "tooltip", "noStyle"],
    components: { Tooltip }
});
</script>
