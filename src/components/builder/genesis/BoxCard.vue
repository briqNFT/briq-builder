<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';
import { computed } from 'vue';

const props = defineProps<{
    tokenName: string,
    mode: CARD_MODES,
}>();

const {
    genesisStore,
    itemQuery,
    item,
    saleQuery,
    saledata,
    getActualMode,
    durationLeft,
} = useBoxData(props.tokenName);

const actualMode = getActualMode(props.mode);

import { userBidsStore, productBidsStore } from '@/builder/BidStore';

const bids = computed(() => userBidsStore.current?.bids ?? []);

const hasHighestBid = computed(() => {
    if (actualMode.value !== 'BID')
        return false;
    return bids.value.some(x => x.bid_id === productBidsStore.bids(props.tokenName).highest_bid)
})
</script>


<style scoped>
.item-card > div {
    @apply flex flex-col relative top-0 transition-all;
}
.item-card:hover > div {
    @apply top-[-0.25rem];
}
#app .item-card:not(.ERROR):hover > div {
    @apply shadow-lg;
}
.item-card p {
    @apply text-copy;
}
</style>

<template>
    <div :class="'item-card relative ' + itemQuery._status">
        <div class="bg-white rounded-md gap-1 shadow-sm">
            <template v-if="itemQuery._status === 'LOADED'">
                <p class="flex-1 min-h-0 min-w-0 flex justify-center items-center my-4">
                    <img class="min-h-0 min-w-0 max-h-[10rem]" :src="genesisStore.coverItemRoute(tokenName)">
                </p>
                <h3 class="font-medium text-md px-4">{{ item.name }} </h3>
                <template v-if="actualMode === 'PRESALE' || actualMode === 'SALE'">
                    <div v-if="saleQuery._status === 'LOADED'" class="px-4 flex justify-between">
                        <p v-if="saledata?.total_quantity === 1" class="text-sm">Unique</p>
                        <p v-else class="text-sm">{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }} left</p>
                        <p v-if="actualMode === 'PRESALE'" class="text-right">{{ Math.floor(saledata?.auction_duration) / 3600 }}h</p>
                    </div>
                </template>
                <template v-if="actualMode === 'SALE' || actualMode === 'BID'">
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <p v-if="actualMode === 'SALE'" class="flex justify-between"><span class="text-grad-dark">Last Bid</span><span><i class="fa-brands fa-ethereum"/> 0.4</span></p>
                        <p v-else-if="hasHighestBid" class="flex justify-between"><span class="text-grad-dark"><i class="text-info-success fas fa-circle-check"/> Winning bid at</span><span><i class="fa-brands fa-ethereum"/> 0.4</span></p>
                        <p v-else class="flex justify-between"><span class="text-grad-dark"><i class="text-info-warning fas fa-circle-exclamation"/> Higher bid at</span><span><i class="fa-brands fa-ethereum"/> 0.4</span></p>
                        <p class="flex justify-between">
                            <span class="text-grad-dark">Sales End</span>
                            <span v-if="durationLeft > 24*60*60">{{ Math.floor(durationLeft/24/60/60) }} day(s) left</span>
                            <span v-else-if="durationLeft > 60*60">{{ Math.floor(durationLeft/60/60) }} hour(s) left</span>
                            <span v-else-if="durationLeft > 60">{{ Math.floor(durationLeft/60) }} minute(s) left</span>
                            <span v-else>{{ Math.floor(durationLeft) }} seconds left</span>
                        </p>
                    </div>
                </template>
            </template>
            <template v-else-if="itemQuery._status === 'ERROR'">
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-times"/><span>Error while loading data</span></p>
            </template>
            <template v-else>
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-spinner animate-spin"/><span>Loading</span></p>
                <!-- prefetch -->
                <img class="hidden" :src="genesisStore.coverItemRoute(tokenName)">
            </template>
        </div>
    </div>
</template>