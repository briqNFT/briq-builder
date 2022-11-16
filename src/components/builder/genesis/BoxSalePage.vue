<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { pushModal } from '@/components/Modals.vue';
import BidModalVue from './BidModal.vue';
import BuyModalVue from './BuyModal.vue';
import { useBoxData } from '@/builder/BoxData';
import { maybeStore } from '@/chain/WalletLoading';
import { userBalance } from '@/builder/UserBalance';
import { productBidsStore, userBidsStore } from '@/builder/BidStore';
import { useBids } from '@/components/BidComposable';

import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { ExplorerTxUrl } from '@/chain/Explorer';

import BriqsImg from '@/assets/genesis/briqs.png';

const route = useRoute();

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

const attributes = computed(() => {
    if (!item.value)
        return [];
    const props = item.value.properties;
    return [
        { name: 'Serial Number', value: `#${item.value.token_id}` },
        { name: 'Theme', value: genesisStore.themedata[route.params.theme as string]?._data?.name },
        { name: 'Artist', value: props.artist.value },
        { name: 'Year', value: new Date(props.date.value).getFullYear() },
        { name: '# of briqs', value: props.nb_briqs.value },
    ]
});

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

const view = ref(('PREVIEW') as 'PREVIEW' | 'SET' | 'BOOKLET');
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
    @apply text-md text-grad-dark break-words;
}
</style>

<template>
    <div class="relative">
        <Header/>
        <div>
            <div class="container m-auto min-h-[95vh]">
                <div class="flex flex-col-reverse md:grid md:grid-cols-[7fr_5fr] gap-6 my-6">
                    <div class="flex flex-col gap-6">
                        <div class="relative h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                            <template v-if="itemQuery._status === 'LOADED'">
                                <div class="flex justify-center items-center h-full w-full select-none">
                                    <div v-show="view === 'PREVIEW'" class="w-full h-full p-4 lg:p-8 xl:p-16 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBoxRoute(token_id)}), url(${genesisStore.coverBoxRoute(token_id, true)})` }"/>
                                    <div v-show="view === 'BOOKLET'" class="w-full h-full p-4 xl:p-8 xl:pb-10 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(token_id)}), url(${genesisStore.coverBookletRoute(token_id, true)})` }"/>
                                    <div v-show="view === 'SET'" class="w-full h-full p-4 lg:p-16 xl:p-24 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverItemRoute(token_id)}), url(${genesisStore.coverItemRoute(token_id, true)})` }"/>
                                    <div class="absolute top-4 left-4 flex flex-col gap-4">
                                        <Btn no-style :class="`${ view === 'PREVIEW' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='PREVIEW'"><img class="max-w-full max-h-full" :src="genesisStore.coverBoxRoute(token_id, true)"></Btn>
                                        <Btn no-style :class="`${ view === 'BOOKLET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='BOOKLET'"><img class="max-w-full max-h-full" :src="genesisStore.coverBookletRoute(token_id, true)"></Btn>
                                        <Btn no-style :class="`${ view === 'SET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='SET'"><img class="max-w-full max-h-full" :src="genesisStore.coverItemRoute(token_id, true)"></Btn>
                                    </div>
                                </div>
                            </template>
                            <template v-else-if="itemQuery._status === 'FETCHING'">
                                <p>Loading image</p>
                            </template>
                            <div v-else><p>Error while loading data</p></div>
                        </div>
                        <div>
                            <h2>Attributes</h2>
                            <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div class="attribute" v-for="attrib of attributes" :key="attrib.name">
                                    <h3>{{ attrib.name }}</h3>
                                    <p>{{ attrib.value }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                        <p class="mt-1">
                            <router-link :to="`/product/${route.params.theme}`" class="hover:text-primary cursor-pointer !text-sm">
                                <i class="fa-solid fa-chevron-left mr-2"/> Go back
                            </router-link>
                        </p>
                        <h1>{{ boxName }}</h1>
                        <p class="my-2 whitespace-pre-line">{{ item?.description ?? 'Loading' }}</p>
                        <div>
                            <p>This box contains:</p>
                            <div class="mt-1 mb-2 flex flex-nowrap items-center">
                                <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-10 brightness-[98%]" :src="genesisStore.coverBookletRoute(token_id)"></p>
                                <p>One instruction <span class="font-medium">booklet NFT</span> that you can use to create an Official&nbsp;Set</p>
                            </div>
                            <div class="flex flex-nowrap items-center">
                                <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-7" :src="BriqsImg"></p>
                                <p>{{ item?.nb_briqs }} <span class="font-medium">briqs</span>, enough to build the Official&nbsp;Set and then more</p>
                            </div>
                        </div>
                        <template v-if="saledata?.isLive() && saledata?.total_quantity === 1">
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
                            <!--<h4>Instant Purchase</h4>-->
                            <div class="rounded border border-grad-light overflow-hidden mt-6">
                                <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                                    <div>
                                        <h5 class="font-normal text-grad-dark">Price</h5>
                                        <p class="text-xl font-semibold pt-1">{{ readableNumber(saledata?.price) }} {{ readableUnit(saledata?.price) }}</p>
                                    </div>
                                    <Btn :disabled="!canBuy" class="!h-auto text-md px-6" @click="buy">Buy now</Btn>
                                </div>
                                <div class="p-6 py-4 flex flex-col gap-4">
                                    <div v-if="saledata?.startIn() > 0" class="w-full flex justify-between items-baseline">
                                        <p><span class="font-medium">Sale starts on: </span> {{ new Date(saledata.auction_start*1000).toLocaleString("en-uk", { dateStyle: "full", timeStyle: "short" }) }}</p>
                                    </div>
                                    <p><span class="font-medium">Availability: </span>{{ saledata?.quantity_left }} / {{ saledata?.total_quantity }}</p>
                                </div>
                            </div>
                            <!--
                            <div>
                                <ul class="list-inside ml-4 text-sm list-disc">
                                    <li>Price drops by 0.28 <i class="fa-brands fa-ethereum"/> until sold out.</li>
                                    <li>Price drops every hour.</li>
                                    <li>Sale ends 24h after the start.</li>
                                </ul>
                            </div>
                            -->
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>