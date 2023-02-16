<script setup lang="ts">
import type { AuctionItemData } from '@/builder/AuctionData';
import { computed } from 'vue';
import { backendManager } from '@/Backend';

const props = defineProps<{
    title: string,
    subtitle: string,
    status: 'LOADED' | 'FETCHING' | 'ERROR',
    auctionData: AuctionItemData,
    expand?: boolean,
}>();

const network = computed(() => props.auctionData.mainAuction.network);

const highImage = computed(() => backendManager.getPreviewUrl(props.auctionData.token_id, network.value));
const lowImage = computed(() => backendManager.getRoute(`set/${network.value}/${props.auctionData.token_id}/small_preview.jpg`))
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
    <div class="bg-white rounded-md shadow-sm item-card w-full">
        <div class="flex flex-col gap-2 h-full">
            <template v-if="status === 'LOADED'">
                <!-- Because we have gap-2 we need to remove 8px from bottom margin -->
                <p
                    :class="`rounded-md overflow-hidden min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-max bg-cover bg-origin-content bg-center bg-no-repeat`"
                    :style="{ backgroundImage: `url(${highImage}), url(${lowImage})` }">
                    <img class="min-h-0 min-w-0 max-h-full max-w-full invisible" :src="lowImage">
                </p>
                <h3 class="font-semibold text-lg px-4 overflow-x-auto">{{ title }} </h3>
                <p class="px-4 flex justify-between text-md py-[1px]">{{ subtitle }}</p>
                <hr class="my-2">

                <div class="p-4 pt-0 flex flex-col gap-2">
                    <p>
                        <span class="text-grad-dark">Auction has ended</span>
                    </p>
                    <p v-if="expand" class="flex justify-between">
                        <RouterLink :to="{ name: 'UserCreation', params: { network: network, set_id: auctionData.token_id } }">
                            <Btn secondary>See details</Btn>
                        </RouterLink>
                    </p>
                    <p v-else class="flex justify-center text-grad-dark italic text-xs">
                        Click on the card to see more
                    </p>
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
