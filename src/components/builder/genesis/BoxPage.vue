<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { pushModal } from '@/components/Modals.vue';
import BidModalVue from './BidModal.vue';
import BuyModalVue from './BuyModal.vue';
import { useBoxData } from '@/builder/BoxData';
import { maybeStore } from '@/chain/WalletLoading';
import { userBalance } from '@/builder/UserBalance';
import { productBidsStore, userBidsStore } from '@/builder/BidStore';
import { useBids } from '@/components/BidComposable';

import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { useUnboxHelpers } from '@/builder/Unbox';
import { ExplorerTxUrl } from '@/chain/Explorer';

const route = useRoute();
const router = useRouter();

const mode = route.name === 'UserBox' ? 'INVENTORY' : 'SALE';

const token_id = computed(() => `${route.params.theme}/${route.params.box}`);

const {
    genesisStore,
    itemQuery,
    item,
    saleQuery,
    saledata,
    getActualMode,
    durationLeft,
} = useBoxData(token_id.value);

const themeName = computed(() => route.params.theme);
const boxName = computed(() => item.value?.name ?? route.params.box);

productBidsStore.fetch(token_id.value);

const previousBids = computed(() => Object.values(productBidsStore.bids(token_id.value).bids).sort((a, b) => b.timestamp - a.timestamp));
const hasBids = computed(() => previousBids.value.length);

const { currentBid, currentBidString } = useBids(token_id.value);

const userBids = computed(() => userBidsStore.current?.bids ?? []);

const hasHighestBid = computed(() => {
    return userBids.value.some(x => x.bid_id === productBidsStore.bids(token_id.value).highest_bid)
})

const canBid = computed(() => {
    if (!maybeStore.value?.userWalletAddress || userBalance.current?.balance?._status !== 'LOADED')
        return false;
    return itemQuery._status !== 'ERROR';
})

const placeBid = () => {
    pushModal(BidModalVue, {
        item: token_id.value,
    });
}

const canBuy = computed(() => {
    if (!maybeStore.value?.userWalletAddress)
        return false;
    return itemQuery._status !== 'ERROR' && saledata.value?.quantity_left;
})

const buy = () => {
    pushModal(BuyModalVue, {
        item: token_id.value,
    });
}

const { unbox } = useUnboxHelpers();

</script>

<style scoped>
h2 {
    @apply text-lg font-semibold my-2;
}
p {
    @apply text-copy;
}

.auction-countdown {
    @apply border border-grad-light rounded bg-grad-lightest;
}

.auction-countdown > div {
    @apply border-r border-grad-light py-4;
}

.auction-countdown > div:last-child {
    @apply border-r-0;
}

.attribute {
    @apply bg-grad-lightest rounded-md border border-grad-light p-6;
    @apply flex flex-col gap-3;
}
.attribute h3 {
    @apply text-md font-medium;
}
.attribute p {
    @apply text-md text-grad-dark break-all;
}
</style>

<template>
    <div class="relative">
        <Header/>
        <div>
            <div class="container m-auto">
                <div class="grid grid-cols-[7fr_5fr] gap-6 my-6">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center min-h-[34rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                            <img v-if="itemQuery._status !== 'ERROR'" :src="genesisStore.coverBoxRoute(token_id)">
                            <div v-else><p>Error while loading box data</p></div>
                        </div>
                        <div>
                            <h2>Attributes</h2>
                            <div class="grid grid-cols-4 gap-6">
                                <div class="attribute">
                                    <h3>Serial Number</h3>
                                    <p>#55</p>
                                </div>
                                <div class="attribute">
                                    <h3>Pieces</h3>
                                    <p>{{ item?.briqs?.length }}</p>
                                </div>
                                <div class="attribute">
                                    <h3>Theme</h3>
                                    <p>{{ themeName }}</p>
                                </div>
                                <div class="attribute">
                                    <h3>Year</h3>
                                    <p>2022</p>
                                </div>
                                <div class="attribute">
                                    <h3>Condition</h3>
                                    <p>Unopened</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                        <p class="mt-1">
                            <a
                                @click="router.go(-1)"
                                class="hover:text-primary cursor-pointer !text-sm">
                                <i class="fa-solid fa-chevron-left mr-2"/> Go back
                            </a>
                        </p>
                        <h1>{{ boxName }}</h1>
                        <p class="my-2">{{ item?.description ?? 'Loading' }}</p>
                        <template v-if="mode === 'INVENTORY'">
                            <div>
                                <h2>Unopened box</h2>
                                <p>Your box is still under blister, open it to see what’s inside or keep it closed. Note that once it’s done you can’t go back.</p>
                                <Btn primary class="p-4 my-4" @click="unbox(token_id)">Unbox</Btn>
                            </div>
                            <div>
                                <h2>Bought at</h2>
                                <p class="text-xl font-medium my-4">{{ readableUnit("3092834092834092834") }} {{ readableNumber("3092834092834092834") }}</p>
                                <Btn secondary>See on Aspect</Btn><Btn secondary>See on Mintsquare</Btn>
                            </div>
                            <div>
                                <h2>Item activity</h2>
                                <p>Some activity here</p>
                            </div>
                        </template>
                        <template v-else-if="saledata?.isLive() && saledata?.total_quantity === 1">
                            <h4>Auction</h4>
                            <div class="rounded border border-grad-light overflow-hidden">
                                <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                                    <div>
                                        <h5 class="font-normal text-grad-dark">Winning bid</h5>
                                        <p v-if="hasBids" class="text-xl font-semibold pt-1">{{ currentBidString }}</p>
                                        <p v-else class="text-xl font-semibold pt-1">-</p>
                                        <p v-if="hasHighestBid" class="text-sm text-grad-dark">You currently have the highest bid.</p>
                                    </div>
                                    <Btn
                                        :secondary="hasHighestBid"
                                        :disabled="!canBid"
                                        @click="placeBid"
                                        class="h-full text-md px-6">
                                        Place bid
                                    </Btn>
                                </div>
                                <div class="p-6 py-4 flex flex-col gap-4">
                                    <div class="w-full flex justify-between items-baseline">
                                        <p><span class="font-medium">Sale starts on: </span> (TODO) July 1, 2022 at 11:32 AM GMT+1</p>
                                        <p>
                                            <template v-for="i in [['d', 2], ['h', 1], ['m', 24], ['s', 43]]" :key="i[0]">
                                                <span class="pl-1">{{ i[1] }}{{ i[0] }}</span>
                                            </template>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <template v-if="productBidsStore.status === 'OK' && hasBids">
                                <h2>Previous bids</h2>
                                <div class="flex flex-col bg-grad-lightest rounded border border-grad-light">
                                    <a
                                        v-for="i in previousBids.slice(0, 10)" :key="i.bid_id"
                                        :href="ExplorerTxUrl(i.tx_hash)" target="_blank"
                                        class="block border-b border-grad-light last:border-none px-4 py-3">
                                        <div class="flex justify-between">
                                            <p class="text-primary">{{ i.bidder.substring(0, 8) + "..." + i.bidder.slice(-8) }}</p>
                                            <p>{{ readableUnit(i.bid_amount) }} {{ readableNumber(i.bid_amount) }} <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                                        </div>
                                    </a>
                                    <p v-if="previousBids.length > 10" class="px-4 py-3 text-sm italic text-center">...Older bids are hidden...</p>
                                </div>
                            </template>
                        </template>
                        <template v-else-if="saledata?.isLive()">
                            <h4>Instant Purchase</h4>
                            <div class="rounded border border-grad-light overflow-hidden">
                                <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                                    <div>
                                        <h5 class="font-normal text-grad-dark">Starting price</h5>
                                        <p class="text-xl font-semibold pt-1">{{ readableNumber(saledata?.price) }} {{ readableUnit(saledata?.price) }}</p>
                                    </div>
                                    <Btn :disabled="!canBuy" class="h-full text-md px-6" @click="buy">Buy now</Btn>
                                </div>
                                <div class="p-6 py-4 flex flex-col gap-4">
                                    <div class="w-full flex justify-between items-baseline">
                                        <p><span class="font-medium">Sale starts on: </span> (TODO) July 1, 2022 at 11:32 AM GMT+1</p>
                                        <p>
                                            <template v-for="i in [['d', 2], ['h', 1], ['m', 24], ['s', 43]]" :key="i[0]">
                                                <span class="pl-1">{{ i[1] }}{{ i[0] }}</span>
                                            </template>
                                        </p>
                                    </div>
                                    <p><span class="font-medium">Availability: </span>{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }}</p>
                                </div>
                            </div>
                            <div>
                                <ul class="list-inside ml-4 text-sm list-disc">
                                    <li>Price drops by 0.28 <i class="fa-brands fa-ethereum"/> until sold out.</li>
                                    <li>Price drops every hour.</li>
                                    <li>Sale ends 24h after the start.</li>
                                </ul>
                            </div>
                        </template>
                    </div>
                </div>
                <div>
                    <h2 class="my-8">Other sets from this theme</h2>
                    <BoxListing/>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>