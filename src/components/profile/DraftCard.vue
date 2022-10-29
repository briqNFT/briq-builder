<script setup lang="ts">
import GenericCard from '../builder/genesis/GenericCard.vue';
import { useGenesisStore } from '@/builder/GenesisStore';
import { useBooklet } from '../builder/BookletComposable';
import { toRef } from 'vue';
import { useSetHelpers } from '../builder/SetComposable';
import ProgressBar from '../generic/ProgressBar.vue';

const genesisStore = useGenesisStore();

const props = defineProps<{
    creation: unknown,
}>();


const {
    openSetInBuilder,
} = useSetHelpers();

const { shapeValidity } = useBooklet(undefined, toRef(props.creation, 'booklet'));
</script>

<template>
    <GenericCard
        :status="creation?.id ? 'LOADED' : 'FETCHING'"
        :title="creation.name"
        subtitle="Draft"
        :image-src="genesisStore.coverBookletRoute(creation.booklet)"
        class="cursor-pointer"
        @click="openSetInBuilder(creation.id)">
        <template #content>
            <p class="flex justify-between text-sm">
                <span class="text-grad-dark">briqs needed</span>
                <span class="font-semibold">{{ creation.getNbBriqs() }}</span>
            </p>
            <p class="flex justify-between text-sm items-center">
                <span class="text-grad-dark">Progress</span>
                <span class="flex-1 ml-4 inline-flex items-baseline gap-2"><ProgressBar class="h-4" :percentage="shapeValidity*100"/> {{ Math.floor(shapeValidity*100) }}%</span>
            </p>
        </template>
    </GenericCard>
</template>