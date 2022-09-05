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
    @apply text-lg font-medium my-2;
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
    @apply text-lg;
}
</style>

<template>
    <div class="relative">
        <Header/>
        <div>
            <div class="container m-auto">
                <p class="my-6">
                    <a
                        @click="router.go(-1)"
                        class="text-primary">
                        <Btn secondary no-background>
                            <i class="fa-solid fa-chevron-left"/> Go back
                        </Btn>
                    </a>
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-6">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center min-h-[34rem] bg-grad-lightest rounded-lg border-grad-light border">
                            <img v-if="itemQuery._status !== 'ERROR'" :src="genesisStore.coverItemRoute(token_id)">
                            <div v-else><p>Error while loading box data</p></div>
                        </div>
                        <div>
                            <h2>Description</h2>
                            <p class="my-4">
                                {{ item?.description ?? 'Loading' }}
                                Association of briqs are named sets.<br><br>
                                Sets can be disassembled to get the briqs back and create something new.<br><br>
                                They can be combined to create even more complex structures.
                            </p>
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
                    <div class="flex flex-col gap-6">
                        <h1 class="text-lg font-semibold">{{ boxName }}</h1>
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
                            <div>
                                <h2>Sale ends on</h2>
                                <p class="my-4">July 1, 2022 at 11:32 AM GMT+1</p>
                                <div class="grid grid-cols-4 auction-countdown">
                                    <div
                                        v-for="i in [['Days', 2], ['Hours', 1], ['Minutes', 24], ['Seconds', 43]]" :key="i[0]"
                                        class="inline-flex flex-col justify-around items-center">
                                        <p class="text-xl font-medium">{{ ('' + i[1]).padStart(2, '0') }}</p>
                                        <p class="text-copy font-medium">{{ i[0] }}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2>Winning Bid</h2>
                                <p v-if="hasBids" class="text-xl font-medium my-4">{{ currentBidString }}</p>
                                <p v-else class="my-4">There are no bids on this item.</p>
                                <p v-if="hasHighestBid" class="my-4">You currently have the highest bid.</p>
                                <Btn
                                    :secondary="hasHighestBid"
                                    :disabled="!canBid"
                                    @click="placeBid">
                                    Place a bid
                                </Btn>
                            </div>
                            <h2>Previous bids</h2>
                            <div class="flex flex-col bg-grad-lightest rounded border border-grad-light">
                                <template v-if="productBidsStore.status === 'OK'">
                                    <p v-if="!hasBids">There are no bids on this item.</p>
                                    <a
                                        v-for="i in previousBids.slice(0, 10)" :key="i.bid_id"
                                        :href="`https://${'goerli.'}voyager.online/tx/${i.bid_id}`" target="_blank"
                                        class="block border-b border-grad-light last:border-none px-4 py-3">
                                        <div class="flex justify-between">
                                            <p class="text-primary">{{ i.bidder.substring(0, 8) + "..." + i.bidder.slice(-8) }}</p>
                                            <p>{{ readableUnit(i.bid_amount) }} {{ readableNumber(i.bid_amount) }} <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                                        </div>
                                    </a>
                                    <p v-if="previousBids.length > 10" class="px-4 py-3 text-sm italic text-center">...Older bids are hidden...</p>
                                </template>
                            </div>
                        </template>
                        <template v-else-if="saledata?.isLive()">
                            <div>
                                <h2>Availability</h2>
                                <p>{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }} left</p>
                            </div>
                            <div>
                                <h2>Current Price</h2>
                                <p class="text-xl font-medium">{{ readableNumber(saledata?.price) }} {{ readableUnit(saledata?.price) }}</p>
                            </div>
                            <div>
                                <h2>Next price drop in</h2>
                                <p class="text-xl font-medium">7min 30 seconds</p>
                            </div>
                            <div>
                                <Btn :disabled="!canBuy" @click="buy">Buy now</Btn>
                            </div>
                        </template>
                        <template v-else>
                            <div>
                                <h2>Auction starts on</h2>
                                <p class="my-4">
                                    July 1, 2022 at 11:32 AM GMT+1
                                </p>
                                <div class="grid grid-cols-4 auction-countdown">
                                    <div
                                        v-for="i in [['Days', 2], ['Hours', 1], ['Minutes', 24], ['Seconds', 43]]" :key="i[0]"
                                        class="inline-flex flex-col justify-around items-center">
                                        <p class="text-xl font-medium">{{ ('' + i[1]).padStart(2, '0') }}</p>
                                        <p class="text-copy font-medium">{{ i[0] }}</p>
                                    </div>
                                </div>
                                <template v-if="saledata?.total_quantity > 1">
                                    <div>
                                        <h2>Starting price</h2>
                                        <p class="text-xl font-medium">1 <i class="fa-brands fa-ethereum"/></p>
                                    </div>
                                </template>
                            </div>
                        </template>
                        <template v-if="mode === 'SALE' && saledata?.total_quantity > 1">
                            <div>
                                <h2>How a Dutch auction works</h2>
                                <div>
                                    <p>Price drops by 0.28 <i class="fa-brands fa-ethereum"/> until sold out.</p>
                                    <p>Price drops every hour.</p>
                                    <p>Sale ends 24h after the start.</p>
                                </div>
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