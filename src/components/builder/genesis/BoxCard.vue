<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';

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
</script>


<style scoped>
.item-card > div {
    @apply flex flex-col relative top-0 transition-all;
}
.item-card:hover > div {
    @apply top-[-0.5rem];
}
.item-card:not(.ERROR):hover > div {
    @apply shadow-xl;
}
.item-card p {
    @apply text-copy;
}
</style>

<template>
    <div :class="'item-card relative ' + itemQuery._status">
        <div class="bg-white p-4 border-[1px] border-gray-200 rounded gap-1">
            <template v-if="itemQuery._status === 'LOADED'">
                <p class="flex-1 min-h-0 min-w-0 flex justify-center items-center my-4">
                    <img class="min-h-0 min-w-0 max-h-[10rem]" :src="genesisStore.coverItemRoute(tokenName)">
                </p>
                <h3 class="font-medium text-md">{{ item.name }} </h3>
                <template v-if="actualMode === 'PRESALE' || actualMode === 'SALE'">
                    <div v-if="saleQuery._status === 'LOADED'" class="flex justify-between">
                        <p v-if="saledata?.total_quantity === 1" class="text-sm font-light text-darkest">UNIQUE</p>
                        <p v-else class="text-sm font-light text-darkest">{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }}</p>
                        <p v-if="actualMode === 'PRESALE'" class="text-right">{{ Math.floor(saledata?.sale_duration) / 3600 }}h</p>
                    </div>
                </template>
                <template v-if="actualMode === 'SALE'">
                    <hr>
                    <p class="flex justify-between"><span>Last Bid</span><span><i class="fa-brands fa-ethereum"/> 0.4</span></p>
                    <p class="flex justify-between">
                        <span>Sales End</span>
                        <span v-if="durationLeft > 24*60*60">{{ Math.floor(durationLeft/24/60/60) }} day(s) left</span>
                        <span v-else-if="durationLeft > 60*60">{{ Math.floor(durationLeft/60/60) }} hour(s) left</span>
                        <span v-else-if="durationLeft > 60">{{ Math.floor(durationLeft/60) }} minute(s) left</span>
                        <span v-else>{{ Math.floor(durationLeft) }} seconds left</span>
                    </p>
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