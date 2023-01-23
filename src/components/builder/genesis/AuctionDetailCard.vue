<script setup lang="ts">
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { AuctionItemData, userBidsStore2 } from '@/builder/AuctionData';
import { maybeStore } from '@/chain/WalletLoading';
import { computed } from 'vue';
import GenericCardVue from './GenericCard.vue';
import * as starknet from 'starknet';
import { pushModal } from '@/components/Modals.vue';
import BidModal from './BidModal.vue';
import { backendManager } from '@/Backend';

const props = defineProps<{
    title: string,
    subtitle: string,
    status: 'LOADED' | 'FETCHING' | 'ERROR',
    image: string,
    auctionData: AuctionItemData,
    expand?: boolean,
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

const cannotBidReason = computed(() => {
    if (!userBidsStore2.current)
        return 'You must connect a wallet to bid';
    if (userBidsStore2.current.getNbBids() >= 5 && !hasBid.value)
        return 'You have already bid on 5 ducks so you cannot bid on this one.';
    return '';
})

</script>

<style scoped>
.item-card p, .item-card :slotted(p) {
    @apply text-copy;
}
.item-card :slotted(.attribute) {
    @apply text-copy text-grad-dark;
}
</style>

<template>
    <div class="bg-white rounded-md shadow-sm item-card">
        <div class="flex flex-col gap-2 h-full">
            <template v-if="status === 'LOADED'">
                <!-- Because we have gap-2 we need to remove 8px from bottom margin -->
                <p
                    :class="`rounded-md overflow-hidden min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-max bg-cover bg-origin-content bg-center bg-no-repeat`"
                    :style="{ backgroundImage: `url(${backendManager.getRoute(`set/${'starknet-testnet'}/${auctionData.token_id}/small_preview.jpg`)})` }">
                    <img class="min-h-0 min-w-0 max-h-full max-w-full" :src="image">
                </p>
                <h3 class="font-semibold text-lg px-4 overflow-x-auto">{{ title }} </h3>
                <p class="px-4 flex justify-between text-md py-[1px]">{{ subtitle }}</p>
                <hr class="my-2">

                <div class="p-4 pt-0 flex flex-col gap-2">
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
                            <Btn :disabled="!!cannotBidReason" :tooltip="cannotBidReason" @click="doBid">Make a bid</Btn>
                        </p>
                        <p v-else class="flex justify-center text-grad-dark italic text-xs">
                            Click on the card to see more
                        </p>
                    </template>
                </div>
            </template>
            <template v-else-if="status === 'ERROR'">
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-xmark"/><span>Error while loading data</span></p>
            </template>
            <template v-else>
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-spinner animate-spin"/><span>Loading</span></p>
                <!-- prefetch -->
                <img class="hidden" :src="image">
            </template>
        </div>
    </div>
</template>
