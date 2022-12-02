<script setup lang="ts">
import { bookletDataStore } from '@/builder/BookletData';
import { useGenesisStore } from '@/builder/GenesisStore';
import { userBookletsStore } from '@/builder/UserBooklets';
import { getCurrentNetwork } from '@/chain/Network';
import { computed, isReactive } from 'vue';
import GenericCardVue from './GenericCard.vue';

const props = defineProps<{
    boxId: string
}>();

const bookletQuery = computed(() => bookletDataStore[getCurrentNetwork()][props.boxId]);
const bookletData = computed(() => bookletQuery.value?._data);
const genesisStore = useGenesisStore();

const nbItems = computed(() => {
    return userBookletsStore?.current?.booklets?.filter(x => x === props.boxId).length ?? '...';
});

const hasPendingActivity = computed(() => {
    return (userBookletsStore.current?.metadata?.[props.boxId]?.updates.length ?? 0) > 0;
});

</script>

<template>
    <GenericCardVue
        :title="bookletData?.name ?? boxId" subtitle="Booklet" :status="bookletQuery._status"
        :image-src="genesisStore.coverBookletRoute(boxId, true)"
        :show-pending-marker="hasPendingActivity">
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
