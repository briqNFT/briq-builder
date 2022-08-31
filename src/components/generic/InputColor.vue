<script setup lang="ts">
import { computed } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
    modelValue: any,
}>();

const modValue = computed({
    set: (value) => {
        emit('update:modelValue', value);
    },
    get: () => {
        return props.modelValue;
    },
});

</script>

<template>
    <div class="relative inline-block mr-2">
        <input type="color" class="absolute opacity-0" v-model="modValue">
        <div class="inline-block w-4 h-4 rounded-sm" :style="{ backgroundColor: modelValue }"/>
    </div>
</template>