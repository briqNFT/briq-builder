<script setup lang="ts">
import { walletStore } from '@/chain/Wallet';
import { computed, ref } from 'vue';
import Window from '../generic/Window.vue';
import { Fetchable } from '@/DataFetching';

defineEmits(['close']);

// Initial text as props
const props = defineProps<{
    steps: {
        name: string,
        task: Fetchable<any>
    }[];
}>();

</script>

<template>
    <Window size="w-full max-w-[80rem]">
        <template #title>Progress</template>
        <p v-for="step, i in props.steps" :key="i">Step {{ step.name }}: {{ step.task._status }}</p>
        <div class="flex gap-4 justify-end items-center">
            <Btn @click="$emit('close')">Close</Btn>
        </div>
    </Window>
</template>
