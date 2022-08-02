<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import ModalsVue, { pushModal } from '@/components/Modals.vue';
import BidModalVue from './BidModal.vue';
import BuyModalVue from './BuyModal.vue';
import { useBoxData } from '@/builder/BoxData';
import { maybeStore } from '@/chain/WalletLoading';
import { userBalance } from '@/builder/UserBalance';

const route = useRoute();
const router = useRouter();

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
    return itemQuery._status !== 'ERROR';
})

const buy = () => {
    pushModal(BuyModalVue, {
        item: token_id.value,
    });
}

</script>

<style scoped>
h2 {
    @apply text-lg font-medium my-2;
}
p {
    @apply text-copy;
}

.auction-countdown {
    @apply border border-darker rounded bg-base;
}

.auction-countdown > div {
    @apply border-r border-darker py-4;
}

.auction-countdown > div:last-child {
    @apply border-r-0;
}

.attribute {
    @apply bg-base rounded-md border border-darker p-6;
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
                        class="text-accent">
                        <Btn secondary no-background>
                            <i class="fa-solid fa-chevron-left"/> Go back
                        </Btn>
                    </a>
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-6">
                    <div class="flex flex-col gap-6">
                        <div class="flex justify-center items-center min-h-[34rem] bg-base rounded-lg border-darker border">
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
                        <template v-if="saledata?.isLive() && saledata?.total_quantity === 1">
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
                                <p class="text-xl font-medium my-4"><i class="fa-brands fa-ethereum"/> 1.35</p>
                                <Btn
                                    class="text-white"
                                    :disabled="!canBid"
                                    @click="placeBid">
                                    Place a bid
                                </Btn>
                            </div>
                            <h2>Previous bids</h2>
                            <div class="flex flex-col gap-2 pt-2">
                                <div v-for="i in new Array(5)" class="flex justify-between">
                                    <p>0xcafe0123babe</p>
                                    <p>1.35 eth <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                                </div>
                            </div>
                        </template>
                        <template v-else-if="saledata?.isLive()">
                            <div>
                                <h2>Availability</h2>
                                <p>{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }} left</p>
                            </div>
                            <div>
                                <h2>Current Price</h2>
                                <p class="text-xl font-medium">{{ saledata?.price }} <i class="fa-brands fa-ethereum"/></p>
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
                        <template v-if="saledata?.total_quantity > 1">
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
    <ModalsVue/>
</template>