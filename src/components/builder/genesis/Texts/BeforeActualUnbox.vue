<script setup lang="ts">
const props = defineProps<{
    active: boolean,
    unbox: CallableFunction
}>();
</script>

<template>
    <hr>
    <p>The box is in your hands. Everything is ready.</p>
    <p class="flex justify-center gap-2 my-4 text-md">
        <Btn @click="props.unbox" :disabled="!props.active">Open the box</Btn>
    </p>
</template>