<script setup lang="ts">
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { AuctionItemData, userBidsStore2 } from '@/builder/AuctionData';
import { maybeStore } from '@/chain/WalletLoading';
import { computed } from 'vue';
import GenericCardVue from './GenericCard.vue';
import * as starknet from 'starknet';
import { pushModal } from '@/components/Modals.vue';
import BidModal from './BidModal.vue';

const props = defineProps<{
    title: string,
    subtitle: string,
    status: 'LOADED' | 'FETCHING' | 'ERROR',
    image: string,
    auctionData: AuctionItemData,
    expand: boolean,
}>();

const hasHighestBid = computed(() => {
    return props.auctionData.highest_bid != '0' && props.auctionData.highest_bidder == maybeStore.value?.userWalletAddress;
})

const highestBid = computed(() => props.auctionData.highest_bid || '0');

const hasBid = computed(() => {
    if (props.auctionData?.bids?.some(x => x.bidder === maybeStore.value?.userWalletAddress))
        return true;
    return !!userBidsStore2.current?.getBid(props.auctionData.auctionId);
})

const hasPendingBid = computed(() => {
    const bid = userBidsStore2.current?.getBid(props.auctionData.auctionId);
    if (!bid)
        return false;
    // If the pending bid is lower than the current highest known bid, don't show it.
    return props.auctionData.highest_bid === '0' || starknet.number.toBN(bid.bid_amount).cmp(starknet.number.toBN(props.auctionData.highest_bid)) > 0;
});

const doBid = async () => {
    await pushModal(BidModal, { item: props.auctionData.auctionId, name: props.title })
}

</script>

<template>
    <GenericCardVue
        :title="title" :subtitle="subtitle" :status="status"
        :image-src="image"
        :show-pending-marker="false">
        <template #content>
            <template v-if="highestBid === '0'">
                <p class="flex justify-between">
                    <span class="text-grad-dark">No confirmed bids yet.</span>
                </p>
            </template>
            <template v-else>
                <p class="flex justify-between">
                    <span class="text-grad-dark">Winning Bid</span><span class="font-medium">{{ readableNumber(highestBid) }} {{ readableUnit(highestBid) }}</span>
                </p>
            </template>
            <p v-if="hasHighestBid" class="flex justify-between">
                <span class="text-grad-dark">Your bid is the winning bid</span><span><i class="text-info-success fas fa-circle-check"/></span>
            </p>
            <p v-else-if="hasPendingBid" class="flex justify-between">
                <span class="text-grad-dark">You have a pending bid</span><span><i class="text-info-info fas fa-spinner animate-spin-slow"/></span>
            </p>
            <p v-else-if="hasBid" class="flex justify-between">
                <span class="text-grad-dark">You have been outbid</span><span><i class="text-info-error fas fa-circle-exclamation"/></span>
            </p>
            <template v-else>
                <p v-if="expand" class="flex justify-between">
                    <RouterLink :to="{ name: 'UserCreation', params: { network: 'starknet-testnet', set_id: auctionData.token_id } }">
                        <Btn secondary>See details</Btn>
                    </RouterLink>
                    <Btn @click="doBid">Make a bid</Btn>
                </p>
                <p v-else class="flex justify-center text-grad-dark italic text-xs">
                    Click on the card to see more
                </p>
            </template>
        </template>
    </genericcardvue>
</template>
