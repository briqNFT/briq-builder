<script setup lang="ts">
import { ref } from 'vue';

const flyout = ref(null as unknown as HTMLDivElement);

defineExpose({
    flyout,
});

</script>

<style scoped>
.dark #app .tempdarkfix {
    @apply border border-grad-light shadow-none;
}
</style>


<template>
    <div ref="flyout" class="rounded bg-grad-lightest shadow-md tempdarkfix relative">
        <slot/>
    </div>
</template>
