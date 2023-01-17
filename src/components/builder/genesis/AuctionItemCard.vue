<script setup lang="ts">
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { AuctionItemData } from '@/builder/AuctionData';
import { maybeStore } from '@/chain/WalletLoading';
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
    return props.auctionData.highest_bid != '0' && props.auctionData.highest_bidder == maybeStore.value?.userWalletAddress;
})

const highestBid = computed(() => props.auctionData.highest_bid || '0');

//props.auctionData.highest_bid

</script>

<template>
    <GenericCardVue
        :title="title" :subtitle="subtitle" :status="status"
        :image-src="image"
        :show-pending-marker="false">
        <template #content>
            <template v-if="highestBid === '0'">
                <p class="flex justify-between">
                    <span class="text-grad-dark">No bids yet</span>
                </p>
                <p class="flex justify-between">
                    <span class="text-grad-dark">Minimum bid</span><span class="font-medium">{{ readableUnit(auctionData.minimum_bid) }} {{ readableNumber(auctionData.minimum_bid) }}</span>
                </p>
            </template>
            <template v-else>
                <p class="flex justify-between">
                    <span class="text-grad-dark">Winning Bid</span><span class="font-medium">{{ readableNumber(highestBid) }} {{ readableUnit(highestBid) }}</span>
                </p>
                <p v-if="hasHighestBid" class="flex justify-between">
                    <span class="text-grad-dark">Your bid is the winning bid</span><span><i class="text-info-success fas fa-circle-check"/></span>
                </p>
                <p v-else class="flex justify-between">
                    <span class="text-grad-dark">You have been outbid</span><span><i class="text-info-error fas fa-circle-exclamation"/></span>
                </p>
            </template>
        </template>
    </GenericCardVue>
</template>
