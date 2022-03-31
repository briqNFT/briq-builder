<template>
    <span :class="'custom-toggle inline-flex items-center p-[0.125em] ' + (active ? 'enabled' : '')" @click="$emit('enable', !active); $emit('update:modelValue', !active)">

        <span class="indicator flex justify-center items-center"><span class="text-[0.875em]"><slot>
            <i :class="'fas fa-check transition-opacity duration-300 ' + (active ? 'opacity-1' : 'opacity-0')"></i>
        </slot></span></span>
    </span>
</template>

<style>
.custom-toggle {
    min-width: 2em;
    height: 1.5em;
    @apply bg-gray-300 dark:bg-gray-700;
    border-radius: 3em;
    transition: all 0.4s;
}

.custom-toggle.enabled {
    @apply bg-accent;
    border-radius: 3.4em;
}


.custom-toggle .indicator {
    @apply shadow-md;
    @apply text-gray-500 dark:text-gray-700;
    @apply bg-white dark:bg-gray-300;
    border-radius:50%;
    position: relative;
    left: 0;
    transition: all 0.4s;
    height: 1.25em;
    width: 1.25em;
}

.custom-toggle.enabled .indicator {
    @apply text-gray-700 dark:text-black;
    position: relative;
    left: calc(100% - 1.25em);
}
</style>

<script lang="ts">
/**
 * A generic Toggle component.
 * Note that everything above is scaled in em to allow scaling the component.
 */
import { defineComponent } from "vue";
export default defineComponent({
    computed: {
        active() {
            return this.enabled || this.modelValue;
        }
    },
    emits: ["enable", "update:modelValue"],
    props: ["enabled", "modelValue"],
});
</script>
