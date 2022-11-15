<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { userBookletsStore } from '@/builder/UserBooklets';
import { computed, toRef } from 'vue';
import { useBooklet } from '../BookletComposable';
import GenericCardVue from './GenericCard.vue';

const props = defineProps<{
    boxId: string
}>();

const { getStepImgSrc, bookletData } = useBooklet(undefined, toRef(props, 'boxId'));

const genesisStore = useGenesisStore();

const nbItems = computed(() => {
    return userBookletsStore?.current?.booklets?.filter(x => x === props.boxId).length ?? '...';
});


</script>

<template>
    <GenericCardVue
        :title="bookletData?.name ?? boxId" subtitle="Booklet" :status="!!bookletData ? 'LOADED' : 'ERROR'"
        :image-src="genesisStore.coverBookletRoute(boxId, true)">
        <template #content>
            <p class="flex justify-between">
                <span class="attribute">briqs needed</span><span class="font-medium">{{ bookletData?.briqs?.length ?? '?' }}</span>
            </p>
            <p class="flex justify-between">
                <span class="attribute">You own</span><span class="font-medium">{{ nbItems }}</span>
            </p>
        </template>
    </GenericCardVue>
</template>
