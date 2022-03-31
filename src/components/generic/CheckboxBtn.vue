<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="noStyle ? '' : 'btn' + ' !p-1 flex justify-center items-center gap-1' + (enabled ? ' enabled' : '')" @click="$emit('enable', !enabled);">
            <Toggle :enabled="enabled" class="w-full"><slot name="icon"></slot></Toggle>
            <slot></slot>
        </button>
    </Tooltip>
</template>

<script lang="ts">
/**
 * A generic Checkbox button component with an automatic tooltip and a status indicator.
 */
import Tooltip from "./Tooltip.vue";
import { defineComponent } from "vue";
export default defineComponent({
    emits: ["enable"],
    props: ["enabled", "tooltip", "noStyle"],
    components: { Tooltip }
});
</script>
