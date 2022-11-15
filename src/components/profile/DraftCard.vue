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

const { shapeValidity, bookletData } = useBooklet(undefined, toRef(props.creation, 'booklet'));

const getPreview = (id: string) => {
    return window.localStorage.getItem('set_preview_' + id);
}
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
                <span class="font-medium flex-1 ml-8 inline-flex items-baseline gap-2"><ProgressBar class="h-2 p-0 !m-0" :percentage="Math.floor(shapeValidity*100)"/>{{ Math.floor(shapeValidity*100) }}%</span>
            </p>
        </template>
    </GenericCard>
</template>