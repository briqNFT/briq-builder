<template>
    <Tooltip :tooltip="tooltip">
        <button v-bind="$attrs" :class="(noStyle ? '' : 'btn')"><slot/></button>
    </Tooltip>
</template>

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
