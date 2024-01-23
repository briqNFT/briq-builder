<script setup lang="ts">
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
        <p v-for="step, i in props.steps" :key="i">
            Step {{ step.name }}:
            <template v-if="step.task._status === 'NA'"><i class="fa-solid fa-hourglass-start"/> waiting</template>
            <template v-else-if="step.task._status === 'FETCHING'"><i class="fa-regular fa-spinner animate-spin-slow"/> processing</template>
            <template v-else-if="step.task._status === 'LOADED'"><i class="far fa-circle-check text-info-success"/> OK</template>
            <template v-else-if="step.task._status === 'ERROR'">
                <i class="far fa-circle-xmark text-info-error"/> Error<br>
                <div class="font-mono text-xs px-2 ml-4 my-1 bg-grad-light rounded-md">{{ step.task._error }}</div>
            </template>
        </p>
        <div class="flex gap-4 justify-end items-center">
            <Btn @click="$emit('close')">Close</Btn>
        </div>
    </Window>
</template>
