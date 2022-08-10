<script setup lang="ts">
import { ref } from 'vue';

const flyout = ref(null as unknown as HTMLDivElement);

defineExpose({
    flyout,
});

</script>

<template>
    <div ref="flyout" class="rounded bg-grad-lightest shadow-md relative">
        <slot/>
    </div>
</template>
