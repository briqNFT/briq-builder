<script setup lang="ts">
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { AuctionItemData } from '@/builder/AuctionData';
import { computed } from 'vue';
import GenericCardVue from './GenericCard.vue';

const props = defineProps<{
    title: string,
    subtitle: string,
    status: 'LOADED' | 'FETCHING' | 'ERROR',
    image: string,
    auctionData: AuctionItemData
}>();

const hasHighestBid = computed(() => {
    return props.auctionData.highest_bid != '0' // && check user wallet is highest bidder;
})

const highestBid = computed(() => props.auctionData.highest_bid);

//props.auctionData.highest_bid

</script>

<template>
    <GenericCardVue
        :title="title" :subtitle="subtitle" :status="status"
        :image-src="image"
        :show-pending-marker="false">
        <template #content>
            <p class="flex justify-between">
                <span class="text-grad-dark">Last Bid</span><span class="font-medium">{{ readableNumber(highestBid) }} {{ readableUnit(highestBid) }}</span>
            </p>
            <p v-if="hasHighestBid" class="flex justify-between">
                <span class="text-grad-dark"><i class="text-info-success fas fa-circle-check"/> Winning bid at</span><span class="font-medium">{{ readableUnit(highestBid) }} {{ readableNumber(highestBid) }}</span>
            </p>
            <p v-else class="flex justify-between">
                <span class="text-grad-dark"><i class="text-info-warning fas fa-circle-exclamation"/> Higher bid at</span><span class="font-medium">{{ readableUnit(highestBid) }} {{ readableNumber(highestBid) }}</span>
            </p>
        </template>
    </GenericCardVue>
</template>
