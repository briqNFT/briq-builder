<script setup lang="ts">
import { setTooltip } from '../../Messages'
</script>

<template>
    <template v-if="tooltip">
        <button :class="noStyle ? '' : 'btn'" @pointerenter="setTooltip(tooltip)" @pointerleave="setTooltip()"><slot></slot></button>
    </template>
    <template v-else="">
        <button :class="noStyle ? '' : 'btn'"><slot></slot></button>
    </template>    
</template>

<script lang="ts">
/**
 * A generic Button component that can automatically set a tooltip.
 */
import { defineComponent, toRef } from "vue";
export default defineComponent({
    props: ["tooltip", "noStyle"]
});
</script>
