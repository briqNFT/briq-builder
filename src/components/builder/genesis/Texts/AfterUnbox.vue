<script setup lang="ts">
const props = defineProps<{
    active: boolean,
    goToBuilder: CallableFunction
}>();
</script>

<template>
    <hr>
    <p class="flex justify-center gap-2 my-4 text-md">
        <Btn @click="props.goToBuilder" :disabled="!props.active">Start building</Btn>
    </p>
</template>