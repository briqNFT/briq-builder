<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';
import { computed } from 'vue';
import { userBidsStore, productBidsStore } from '@/builder/BidStore';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';

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

const bids = computed(() => userBidsStore.current?.bids ?? []);

const hasHighestBid = computed(() => {
    if (actualMode.value !== 'BID')
        return false;
    return bids.value.some(x => x.bid_id === productBidsStore.bids(props.tokenName).highest_bid)
})
const highestBid = computed(() => {
    if (!productBidsStore.bids(props.tokenName).highest_bid)
        return '0';
    return productBidsStore.bids(props.tokenName).bids[productBidsStore.bids(props.tokenName).highest_bid!].bid_amount;
})
</script>


<style scoped>
.item-card > div {
    @apply flex flex-col relative top-0 transition-all duration-300;
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
        <div class="bg-white rounded-md gap-2 shadow-sm">
            <template v-if="itemQuery._status === 'LOADED'">
                <!-- Because we have gap-2 we need to remove 8px from bottom margin -->
                <p class="min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-[13rem]">
                    <img class="min-h-0 min-w-0 max-h-full max-w-full" :src="genesisStore.coverBoxRoute(tokenName)">
                </p>
                <h3 class="font-semibold text-md px-4 break-all">{{ item.name }} </h3>
                <template v-if="actualMode === 'PRESALE' && saleQuery._status === 'LOADED'">
                    <div class="px-4 flex justify-between text-sm leading-none py-[1px]">
                        <p v-if="saledata?.total_quantity === 1">Unique</p>
                        <p v-else>{{ saledata?.total_quantity }} for sale</p>
                    </div>
                </template>
                <template v-else-if="actualMode === 'SALE'">
                    <div v-if="saleQuery._status === 'LOADED'" class="px-4 flex justify-between text-sm leading-none py-[1px]">
                        <p v-if="saledata?.total_quantity === 1">Unique</p>
                        <p v-else>{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }} left</p>
                    </div>
                </template>
                <template v-if="actualMode === 'PRESALE'">
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <p class="flex justify-between"><span class="text-grad-dark">Initial price</span><span class="font-semibold">0.01 ETH</span></p>
                        <p class="flex justify-between">
                            <span class="text-grad-dark">Sales begins in</span>
                            <span v-if="!saledata?.startIn()">...</span>
                            <span v-else-if="saledata.startIn() > 24*60*60">{{ Math.floor(saledata.startIn()/24/60/60) }} day(s)</span>
                            <span v-else-if="saledata.startIn() > 60*60">{{ Math.floor(saledata.startIn()/60/60) }} hour(s)</span>
                            <span v-else-if="saledata.startIn() > 60">{{ Math.floor(saledata.startIn()/60) }} minute(s)</span>
                            <span v-else>{{ Math.floor(saledata.startIn()) }} seconds</span>
                        </p>
                    </div>
                </template>
                <template v-else-if="actualMode === 'INVENTORY'">
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <p class="flex justify-between">
                            <span class="text-grad-dark">Bought at</span>
                            <span class="font-semibold">{{ readableUnit(highestBid) }} {{ readableNumber(highestBid) }}</span>
                        </p>
                        <p class="flex justify-between">
                            <span class="text-grad-dark">On</span>
                            <span>August 5 2022</span>
                        </p>
                    </div>
                </template>
                <template v-else>
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <p v-if="actualMode === 'SALE' && saledata?.total_quantity === 1" class="flex justify-between">
                            <span class="text-grad-dark">Last Bid</span><span class="font-semibold">{{ readableNumber(highestBid) }} {{ readableUnit(highestBid) }}</span>
                        </p>
                        <p v-else-if="actualMode === 'SALE'" class="flex justify-between">
                            <span class="text-grad-dark">Current Price</span><span class="font-semibold">{{ readableNumber(saledata.price) }} {{ readableUnit(saledata.price) }}</span>
                        </p>
                        <p v-else-if="hasHighestBid" class="flex justify-between">
                            <span class="text-grad-dark"><i class="text-info-success fas fa-circle-check"/> Winning bid at</span><span class="font-semibold">{{ readableUnit(highestBid) }} {{ readableNumber(highestBid) }}</span>
                        </p>
                        <p v-else class="flex justify-between">
                            <span class="text-grad-dark"><i class="text-info-warning fas fa-circle-exclamation"/> Higher bid at</span><span class="font-semibold">{{ readableUnit(highestBid) }} {{ readableNumber(highestBid) }}</span>
                        </p>
                        <p class="flex justify-between">
                            <span class="text-grad-dark">Sales End</span>
                            <span v-if="!durationLeft">...</span>
                            <span v-else-if="durationLeft > 24*60*60">{{ Math.floor(durationLeft/24/60/60) }} day(s) left</span>
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