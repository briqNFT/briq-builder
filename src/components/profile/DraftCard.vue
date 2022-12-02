<script setup lang="ts">
import GenericCard from '../builder/genesis/GenericCard.vue';
import { useGenesisStore } from '@/builder/GenesisStore';
import { useBooklet } from '../builder/BookletComposable';
import { computed, toRef } from 'vue';
import { useSetHelpers } from '../builder/SetComposable';
import ProgressBar from '../generic/ProgressBar.vue';

const genesisStore = useGenesisStore();

const props = defineProps<{
    creation: unknown,
}>();


const {
    openSetInBuilder,
} = useSetHelpers();

const { shapeValidity, bookletData } = useBooklet(props.creation.booklet);

// Show at least 1% because seeing 0% is weird af.
const progress = computed(() => {
    const value = Math.floor(shapeValidity.value * 100);
    if (value === 0)
        return 1;
    return value;
})
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
            <p class="flex justify-between">
                <span class="attribute">briqs used</span>
                <span class="font-medium">{{ creation.getNbBriqs() }}/{{ bookletData?.briqs.length }}</span>
            </p>
            <p class="flex justify-between">
                <span class="attribute">Progress</span>
                <span class="font-medium flex-1 ml-8 inline-flex items-baseline gap-2"><ProgressBar class="h-2 p-0 !m-0" :percentage="progress"/>{{ progress }}%</span>
            </p>
        </template>
    </GenericCard>
</template>