<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import ToggleParagraph from '@/components/generic/ToggleParagraph.vue';

import { useThemeURLs } from './ThemeUrlComposable';
import { auctionDataStore, getAuctionData, userBidsStore } from '@/builder/AuctionData';
import type { auctionId } from '@/builder/AuctionData';
import AuctionItemCard from './AuctionItemCard.vue';
import { backendManager } from '@/Backend';
import { externalSetCache } from '@/builder/ExternalSets';
import AuctionDetailCard from './AuctionDetailCard.vue';
import { APP_ENV } from '@/Meta';
import * as starknet from 'starknet';
import { isAllowListedForDucks, allowlistedDucks, useSearch } from '@/builder/DucksSale';
import { maybeStore } from '@/chain/WalletLoading';
import Toggle from '@/components/generic/Toggle.vue';
import { ExplorerContractUrl, ExplorerTxUrl } from '@/chain/Explorer';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { router } from '@/Routes';
import { Fetchable } from '@/DataFetching';

const route = useRoute();
const network = APP_ENV === 'prod' ? 'starknet-mainnet' : 'starknet-testnet';

const themeName = computed(() => 'ducks_everywhere');

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );
const themeBoxes = computed(() => Object.keys(auctionDataStore[network]['ducks_everywhere']._data?._data || {}));

const themeStatus = computed(() => {
    return themeData.value && auctionDataStore[network]['ducks_everywhere']._data?._status;
});

const {
    themeCoverUrl,
    themeLogoSrcSet,
} = useThemeURLs();

const coverUrl = computed(() => {
    return (quality: 'high' | 'low') => {
        let base = themeCoverUrl(themeName.value, quality);
        return base;
    }
})

const duckTokens = computed(() => themeBoxes.value?.filter(x => getAuctionData(network, x)!._data?.token_id).sort(sortDucks) || []);
const filteredDucks = computed(() => duckTokens.value?.filter(shouldShow) || []);

const getSet = (auctionId: auctionId) => externalSetCache[network][getAuctionData(network, auctionId)!._data!.token_id]._data;

const { searchBar, sortOrder, onlyNoBids } = useSearch();

const shouldShow = (auctionId: auctionId) => {
    if (onlyNoBids.value && getAuctionData(network, auctionId)?._data?.highest_bid != '0')
        return false;
    if (!searchBar.value)
        return true;
    const name = getSet(auctionId)?.name;
    if (name && name.toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1)
        return true;
    return false;
};

const sortDucks = (a: auctionId, b: auctionId) => {
    return _sortDucks(sortOrder.value)(a, b);
}

const _sortDucks = (sorting: any) => (a: auctionId, b: auctionId) => {
    if (sorting === 'bids_desc' || sorting === 'bids_asc') {
        let cmp = starknet.number.toBN(getAuctionData(network, b)._data?.highest_bid).cmp(
            starknet.number.toBN(getAuctionData(network, a)._data?.highest_bid),
        );
        if (cmp !== 0)
            return sorting === 'bids_desc' ? cmp : -cmp;
    }
    if (sorting === 'dates_desc' || sorting === 'dates_asc') {
        let ba = getAuctionData(network, a)._data?.bids[0]?.timestamp;
        let bb = getAuctionData(network, b)._data?.bids[0]?.timestamp;
        if (ba && bb)
            return sorting === 'dates_desc' ? -ba.localeCompare(bb) : ba.localeCompare(bb);
        else if (ba)
            return -1;
        else if (bb)
            return 1;
    }
    return (getSet(a)?.name || a).localeCompare(getSet(b)?.name || b);
}

// Make sure to scroll up when searching or behaviour gets a bit weird.
const ducksListing = ref(null as unknown as HTMLElement);
watchEffect(() => {
    if (!ducksListing.value)
        return;
    searchBar.value;
    onlyNoBids.value;
    if (ducksListing.value.getBoundingClientRect().top < -100)
        window.scrollTo(0, ducksListing.value.getBoundingClientRect().top + window.scrollY - 200);
})

// Bidding starknet.id stuff
/*
const bidderAddresses = ref({} as Record<string, Fetchable<string | false>>);
watchEffect(() => {
    for (const bid of latestBids.value) {
        if (bidderAddresses.value[bid.highest_bidder] !== undefined)
            continue;
        bidderAddresses.value[bid.highest_bidder] = new Fetchable<string>();
        bidderAddresses.value[bid.highest_bidder].fetch(async () => {
            const response = await fetch('https://app.starknet.id/api/indexer/addr_to_domain?addr=' + starknet.number.toBN(bid.highest_bidder).toString());
            const json = await response.json()
            if (json.domain)
                return json.domain;
            return false;
        });
    }
})
*/

const hoveredAuction = ref(undefined as undefined | string);
const hoverLock = ref(undefined as undefined | string);

// Select a duck when we've loaded the data.
const selectFirstDuck = () => {
    const stopHandle = watchEffect(() => {
        if (!duckTokens.value.length)
            return;
        setHoveredDuck(duckTokens.value[0]);
        // Timeout to make sure stopHandle is defined.
        setTimeout(() => stopHandle(), 0);
    });
    return stopHandle;
}

let stopSFD : any;
onMounted(() => {
    stopSFD = selectFirstDuck();
});

onUnmounted(() => {
    stopSFD();
});

// Have some debouncing so that clicking to lock a card -> hover on the right to bid
// doesn't flash cards for a short while if you go fast enough (AKA UI magic).
let upcomingHover = undefined as auctionId | undefined;
let timeout: unknown;
const setHoveredDuck = (auctionId: auctionId | undefined) => {
    upcomingHover = auctionId;
    if (hoverLock.value === hoveredAuction.value) {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => {
            hoveredAuction.value = upcomingHover;
        }, 100);
    } else
        hoveredAuction.value = upcomingHover;
};

const releaseDate = computed(() => (themeData.value?.sale_start || 0) * 1000)
const hasStarted = computed(() => releaseDate.value && releaseDate.value < Date.now());

const iScroll = ref(25);
const popScroll = () => setTimeout(() => {
    iScroll.value += 25;
    popScroll();
}, APP_ENV === 'dev' ? 200 : 1000);
popScroll();

</script>

<style scoped>
.faq p {
    @apply mb-4 text-justify text-sm text-[#aaaaaa] leading-snug;
}
.faq p a {
    @apply text-primary;
}

.fade-enter-to, .fade-leave-from, .fade-hoverlock-leave-from
{
    opacity: 100%;
}

.fade-enter-from, .fade-leave-to, .fade-hoverlock-leave-to,
    .fake-fadeout-leave-from, .fake-fadeout-leave-to,
    .fake-fadeout-enter-to, .fake-fadeout-enter-from {
    opacity: 0%;
}
.fake-fadeout-leave-active {
    transition: all 0s;
}
.fade-enter-active, .fade-leave-active, .fake-fadeout-enter-active {
    transition: all 0.3s ease !important;
}
.fade-hoverlock-leave-active {
    transition: all 0.2s ease !important;
}
.fade-hoverlock-leave-from {
    @apply !rotate-[3deg];
}
.fade-hoverlock-leave-to {
    @apply !rotate-[6deg];
}

</style>

<template>
    <div class="">
        <Header/>
        <div>
            <div class="bg-black text-white">
                <div class="h-[585px] relative">
                    <div class="absolute w-full h-full theme-bg overflow-hidden">
                        <img :src="coverUrl('low')" alt="logo" class="invisible absolute h-full 2xl:h-auto 2xl:w-full max-w-none max-h-none top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
                        <div class="h-full w-full bg-cover bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${coverUrl('high')}), url(${coverUrl('low')})` }"/>
                    </div>
                    <div class="min-h-[585px] container py-[3.375rem] m-auto px-2 md:px-8 lg:px-[3.375rem] relative z-1">
                        <!--<h1 class="text-left font-black uppercase my-16">{{ themeData.name || route.params.theme }}</h1>-->
                        <h1><img class="min-h-[7rem]" :srcset="themeLogoSrcSet(themeName)" :alt="themeData?.name || (route.params.theme as string)"></h1>
                        <div class="mt-12 mb-8">
                            <h3 class="mb-3">{{ themeData?.tagline ?? "Loading theme name " }}</h3>
                            <p class="whitespace-pre-line">{{ themeData?.description ?? 'Loading description' }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-8">
                <template v-if="themeStatus === 'LOADED'">
                    <div class="sticky top-[calc(4rem-1px)] z-10 my-2 bg-background py-6 w-full">
                        <div class="max-w-[1600px] px-8 m-auto flex gap-2 md:flex-nowrap flex-wrap">
                            <p class="relative flex items-center flex-1 min-w-[16rem] max-w-[38rem]">
                                <input class="w-full" type="text" v-model="searchBar" placeholder="Search for a specific duck">
                                <i class="fa-solid fa-magnifying-glass absolute right-3"/>
                            </p>
                            <div class="flex gap-2">
                                <p class="relative w-[14rem]">
                                    <select class="relative w-full h-full" v-model="sortOrder">
                                        <option value="a_z">Sort alphabetically</option>
                                        <option value="dates_desc">Sort by latest bids</option>
                                        <option value="dates_asc">Sort by oldest bids</option>
                                        <option value="bids_desc">Sort by highest bids</option>
                                        <option value="bids_asc">Sort by lowest bids</option>
                                    </select>
                                </p>
                                <p>
                                    <Btn secondary class="font-sm font-normal px-2 py-2 h-auto" @click="onlyNoBids = !onlyNoBids">
                                        <Toggle v-model="onlyNoBids" class="w-10 mr-2 pointer-events-none"/>
                                        Show ducks without bids only
                                    </Btn>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="max-w-[1600px] px-8 m-auto mt-3" ref="ducksListing">
                        <div
                            class="grid gap-4 grid-cols-[min-content_20rem] tall-md:grid-cols-[min-content_minmax(16rem,auto)]">
                            <div
                                class="grid gap-2 lg:gap-4 sm:grid-cols-[repeat(2,9rem)]
                                md:grid-cols-[repeat(3,9rem)]
                                lg:grid-cols-[repeat(4,10rem)] xl:grid-cols-[repeat(5,10rem)] 2xl:grid-cols-[repeat(6,10rem)]"
                                @pointerleave="hoverLock && setHoveredDuck(undefined)">
                                <div
                                    v-for="duckId, i in duckTokens" :key="duckId + i"
                                    v-show="shouldShow(duckId)"
                                    class="w-[9rem] h-[9rem] lg:w-[10rem] lg:h-[10rem]">
                                    <p v-if="!getSet(duckId) || iScroll < i">...Loading data...</p>
                                    <div
                                        v-else
                                        :class="`h-full w-full cursor-pointer overflow-hidden rounded transition-all duration-300 ${hoverLock == duckId ? 'border-grad-dark' : 'border-transparent hover:border-grad-dark/50'} border-4 flex justify-center items-center`"
                                        @mouseenter="setHoveredDuck(duckId)"
                                        @click="hoverLock = duckId">
                                        <img :src="backendManager.getRoute(`set/${network}/${getSet(duckId)!.id}/small_preview.jpg`)">
                                    </div>
                                </div>
                                <h5 class="col-span-full" v-show="!filteredDucks.length">There are no ducks matching the filters you've entered</h5>
                            </div>
                            <div class="relative min-h-[30rem]">
                                <div class="sticky top-[9.2rem] z-5 flex justify-center w-full">
                                    <div class="max-w-[26rem] min-h-[38rem] relative w-full">
                                        <Transition name="fade-hoverlock">
                                            <AuctionDetailCard
                                                :key="hoverLock"
                                                v-if="getAuctionData(network, hoverLock)?._data"
                                                :class="`!absolute top-0 transition-all duration-500 origin-bottom-left ${ hoveredAuction && hoveredAuction !== hoverLock ? 'rotate-[3deg]' : '' }`"
                                                :auction-data="getAuctionData(network, hoverLock)._data"
                                                :expand="true"
                                                :title="getSet(hoverLock)?.name"
                                                :subtitle="getSet(hoverLock)?.description"
                                                :status="'LOADED'"/>
                                        </Transition>
                                        <!-- This item exists solely so that the opacity transition doesn't reveal the background but stays on a card,
                                        since that looks better -->
                                        <Transition name="fake-fadeout">
                                            <AuctionDetailCard
                                                v-if="hoveredAuction && hoveredAuction !== hoverLock && getAuctionData(network, hoveredAuction)?._data"
                                                :class="`!absolute top-0`"
                                                :auction-data="getAuctionData(network, hoveredAuction)._data"
                                                :title="getSet(hoveredAuction)?.name"
                                                :subtitle="getSet(hoveredAuction)?.description"
                                                :status="'LOADED'"/>
                                        </Transition>
                                        <Transition name="fade">
                                            <AuctionDetailCard
                                                :key="hoveredAuction"
                                                v-if="hoveredAuction && hoveredAuction !== hoverLock && getAuctionData(network, hoveredAuction)?._data"
                                                :class="`!absolute top-0 ${hoverLock ? '!shadow-xl' : ''}`"
                                                :auction-data="getAuctionData(network, hoveredAuction)._data"
                                                :title="getSet(hoveredAuction)?.name"
                                                :subtitle="getSet(hoveredAuction)?.description"
                                                :status="'LOADED'"/>
                                        </Transition>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else-if="themeStatus === 'FETCHING'">
                    <div class="h-[400px] flex justify-center items-center"><p class="text-xl font-medium text-grad-darker italic">Loading collection <i class="ml-4 fas fa-spinner animate-spin-slow"/></p></div>
                </template>
                <template v-else-if="themeStatus === 'ERROR'">
                    <div class="h-[400px] flex justify-center items-center flex-col">
                        <p class="text-xl font-medium my-4">Error loading data</p>
                        <p class="rounded bg-grad-light font-mono text-copy border-grad-darkest border p-4">{{ genesisStore.themedata[themeName]._error }}</p>
                    </div>
                </template>
            </div>
            <div class="bg-black text-white pb-8">
                <div class="container max-w-[42rem] m-auto py-8">
                    <h3 class="text-center mb-6">FAQ</h3>
                    <div class="faq flex flex-col gap-4">
                        <ToggleParagraph>
                            <template #title>What is Ducks Everywhere?</template>
                            <div>
                                <p>The <a href="https://twitter.com/DucksEverywher2" target="_blank">Ducks Everywhere</a> collection is waddling into town, and it's bringing a whole flock of adorable NFT duckies with it.</p>
                                <p>These tiny, briq-built ducks are the perfect addition to any collection that's in need of some quackers. With only 200 available, each one is a unique creation of artist <a href="https://twitter.com/outsmth" target="_blank">OutSmth</a></p>
                            </div>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>How does the sale work?</template>
                            <div>
                                <p>The sale happens in two steps: First an allowlist auction where all whitelisted addresses can bid on a maximum of 5 different ducks.</p>
                                <p>Then, the ducks that haven’t been sold will be sold in a blind raffle open to everyone. You’ll be able to buy one of the remaining ducks, but you won’t know which one until the raffle is over and we reveal the ducks!</p>
                            </div>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>Which addresses are in the auction allowlist?</template>
                            <div>
                                <p> - Addresses which own a Duck on StarkNet Testnet Goerli 1 on the date of the snapshot (will be announced via our <a href="https://twitter.com/briqNFT" target="_blank">Twitter</a>)</p>
                                <p> - Addresses which own a box, a booklet or an official briq set on StarkNet Mainnet.</p>
                                <p>Custom creations do not qualify for the allowlist.</p>
                            </div>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>What do I get when I buy a Ducks Everywhere set?</template>
                            <p>You will get a fully built out briq Official Set. This Official Set will contain a Ducks Everywhere Booklet, that can be used to identify this NFT amongs all other briq sets and ensure it remains unique forever.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>Do I need to build the Ducks Everywhere set?</template>
                            <p>Nope! The set is already fully built out by OutSmth.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>What happens if I disassemble my Ducks Everywhere set?</template>
                            <div>
                                <p>You will receive briqs and the booklet NFT inside the Ducks Everywhere. You will be able to build anything you want with the briqs you receive.</p>
                                <p>If you want to rebuild your Ducks Everywhere set you will be able to do so by following the instructions in the booklet.</p>
                            </div>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>On which blockchain is this available?</template>
                            <div>
                                <p>Briq is available on StarkNet, a validity rollup working on Ethereum (more information <a href="https://starkware.co/starknet/" target="_blank">here</a>). </p>
                                <p>In terms of wallet you can use <a href="https://www.argent.xyz/argent-x/" target="_blank">Argent X</a> and <a href="https://braavos.app/" target="_blank">Braavos</a>. Metamask doesn’t yet work on StarkNet. We recommend using the Chrome browser.</p>
                            </div>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>Something doesn’t work, what should I do?</template>
                            <p><a href="https://discord.gg/kpvbDCw5pr" target="_blank">Reach out to us on Discord</a>, the team will help you out!</p>
                        </ToggleParagraph>
                    </div>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>
