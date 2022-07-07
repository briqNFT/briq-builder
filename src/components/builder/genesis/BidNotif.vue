<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { BidNotif } from './BidNotif';

const props = defineProps<{
    notif: BidNotif
}>();

const genesisStore = useGenesisStore();

</script>

<template>
    <div class="text-left grid grid-cols-[auto_160px]">
        <div class="flex flex-col gap-2">
            <h4>Item: {{ genesisStore.metadata[notif.item]._data?.name || notif.item }}</h4>
            <p>Bid: {{ notif.value }}</p>
        </div>
        <router-link :to="`/box/${notif.item}`"><Btn secondary class="text-xs">Go to product page</Btn></router-link>
    </div>
</template>
