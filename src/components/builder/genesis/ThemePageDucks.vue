<script setup lang="ts">
import { ref, computed, watchEffect, watch, reactive } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import ToggleParagraph from '@/components/generic/ToggleParagraph.vue';

import { useThemeURLs } from './ThemeUrlComposable';
import { auctionDataStore, auctionId, userBidsStore2 } from '@/builder/AuctionData';
import AuctionItemCard from './AuctionItemCard.vue';
import { backendManager } from '@/Backend';
import { externalSetCache } from '@/builder/ExternalSets';
import AuctionDetailCard from './AuctionDetailCard.vue';
import { APP_ENV } from '@/Meta';
import * as starknet from 'starknet';

const route = useRoute();

const themeName = computed(() => 'ducks_everywhere');

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );
const themeBoxes = computed(() => Object.keys(auctionDataStore['starknet-testnet']['ducks_everywhere/1']._data?._data || {}));

const themeStatus = computed(() => {
    return auctionDataStore['starknet-testnet']['ducks_everywhere/1']._data?._status;
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

const availableDucks = computed(() => themeBoxes.value?.filter(x => auctionDataStore['starknet-testnet'][x].auctionData(x)._data?.token_id) || []);

const getSet = (auctionId: auctionId) => externalSetCache['starknet-testnet'][auctionDataStore['starknet-testnet'][auctionId].auctionData(auctionId)._data!.token_id]._data;

const searchBar = ref<string>();
const sortOrder = ref('a_z');

const sortDucks = (a: auctionId, b: auctionId) => {
    if (sortOrder.value === 'bids_desc' || sortOrder.value === 'bids_asc') {
        let cmp = starknet.number.toBN(auctionDataStore['starknet-testnet'][b].auctionData(b)._data?.highest_bid).cmp(
            starknet.number.toBN(auctionDataStore['starknet-testnet'][a].auctionData(a)._data?.highest_bid),
        );
        if (cmp !== 0)
            return sortOrder.value === 'bids_desc' ? cmp : -cmp;
    }
    if (sortOrder.value === 'dates_desc' || sortOrder.value === 'dates_asc') {
        let ba = auctionDataStore['starknet-testnet'][a].auctionData(a)._data?.bids[0]?.timestamp;
        let bb = auctionDataStore['starknet-testnet'][b].auctionData(b)._data?.bids[0]?.timestamp;
        if (ba && bb)
            return sortOrder.value === 'dates_desc' ? -ba.localeCompare(bb) : ba.localeCompare(bb);
        else if (ba)
            return -1;
        else if (bb)
            return 1;
    }
    return (getSet(a)?.name || a).localeCompare(getSet(b)?.name || b);
}

const bidOnDucks = computed(() => availableDucks.value?.filter(x => userBidsStore2.current?.getBid(x)).sort(sortDucks) || []);
const notBidOnDucks = computed(() => availableDucks.value?.filter(x => !userBidsStore2.current?.getBid(x)).sort(sortDucks).slice(0, iScroll.value) || []);

const shouldShow = (auctionId: auctionId) => {
    if (!searchBar.value)
        return true;
    const name = getSet(auctionId)?.name;
    if (name && name.toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1)
        return true;
    return false;
};

const hoveredAuction = ref(undefined as undefined | string);
const hoverLock = ref(undefined as undefined | string);

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

const releaseDate = Date.now() - 10000;

const isLive = computed(() => releaseDate < Date.now());

const timerCountdown = computed(() => {
    let tl = Math.max(releaseDate - Date.now(), 0) / 1000;
    const days = Math.floor(tl / 24 / 3600);
    tl -= days * 24 * 3600;
    const hours = Math.floor(tl / 3600);
    tl -= hours * 3600;
    const minutes = Math.floor(tl / 60);
    tl -= minutes * 60;
    const seconds = Math.floor(tl);
    return [[days !== 1 ? 'Days' : 'Day', days], [hours !== 1 ? 'Hours' : 'Hour', hours], [minutes !== 1 ? 'Minutes' : 'Minute', minutes], [seconds !== 1 ? 'Seconds' : 'seconds', seconds]];
});


const iScroll = ref(20);
const popScroll = () => setTimeout(() => {
    iScroll.value += 10;
    popScroll();
}, APP_ENV === 'dev' ? 200 : 2000);
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
                        <div v-if="!isLive" class="text-[55%] sm:text-sm md:text-md absolute bottom-[-15px] right-[2rem]">
                            <svg viewBox="0 0 1000 100" height="120px" xmlns="http://www.w3.org/2000/svg">
                                <text x="1000" y="64" font-size="4rem" font-weight="900" text-anchor="end" font-family="Work Sans" fill-opacity="0.3" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                    AUCTION FEB 08-13
                                </text>
                                <mask id="myMask">
                                    <text x="1000" y="64" font-size="4rem" stroke-width="5px" font-weight="900" text-anchor="end" font-family="Work Sans" stroke="#ffffff" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                        AUCTION FEB 08-13
                                    </text>
                                </mask>
                                <text x="1000" y="64" mask="url(#myMask)" stroke-width="5px" font-size="4rem" font-weight="900" text-anchor="end" font-family="Work Sans" stroke-opacity="0.8" stroke="#ffffff" fill="#ffffff" paint-order="stroke" letter-spacing="2px">
                                    AUCTION FEB 08-13
                                </text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <template v-if="isLive">
                <div class="mb-8">
                    <template v-if="themeStatus === 'LOADED'">
                        <div class="sticky top-[calc(4rem-1px)] z-10 my-2 bg-background py-6 w-full">
                            <div class="max-w-[1600px] px-8 m-auto flex gap-2">
                                <p class="relative flex items-center flex-1 max-w-[38rem]">
                                    <input class="w-full" type="text" v-model="searchBar" placeholder="Search for a specific duck">
                                    <i class="fa-solid fa-magnifying-glass absolute right-3"/>
                                </p>
                                <p class="relative w-[14rem]">
                                    <select class="relative w-full" v-model="sortOrder">
                                        <option value="a_z">Sort alphabetically</option>
                                        <option value="dates_desc">Sort by latest bids</option>
                                        <option value="dates_asc">Sort by oldest bids</option>
                                        <option value="bids_desc">Sort by highest bids</option>
                                        <option value="bids_asc">Sort by lowest bids</option>
                                    </select>
                                </p>
                            </div>
                        </div>
                        <div class="max-w-[1600px] px-8 m-auto mt-3">
                            <template v-if="bidOnDucks.length">
                                <h2>My bids</h2>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-4 my-4 justify-items-center">
                                    <div
                                        v-for="duckId, i in bidOnDucks" :key="duckId + i"
                                        class="w-fit" v-show="shouldShow(duckId)">
                                        <p v-if="!getSet(duckId)">...Loading data...</p>
                                        <RouterLink v-else :to="{ name: 'UserCreation', params: { network: 'starknet-testnet', set_id: getSet(duckId)!.id } }">
                                            <AuctionItemCard
                                                :auction-data="auctionDataStore['starknet-testnet'][duckId].auctionData(duckId)._data"
                                                :title="getSet(duckId)!.name ?? 'Loading'"
                                                :subtitle="'Official Set & Booklet'"
                                                :image="backendManager.getPreviewUrl(getSet(duckId)!.id, 'starknet-testnet')"
                                                :status="'LOADED'"/>
                                        </RouterLink>
                                    </div>
                                </div>
                                <h2 class="mt-8 mb-4">Other ducks</h2>
                            </template>
                            <div
                                class="grid gap-4 grid-cols-[min-content_minmax(20rem,auto)]">
                                <div
                                    class="grid gap-2 lg:gap-4 sm:grid-cols-[repeat(2,9rem)]
                                    md:grid-cols-[repeat(3,9rem)]
                                    lg:grid-cols-[repeat(4,10rem)] xl:grid-cols-[repeat(5,10rem)] 2xl:grid-cols-[repeat(6,10rem)]"
                                    @pointerleave="setHoveredDuck(undefined)">
                                    <div
                                        v-for="duckId, i in notBidOnDucks" :key="duckId + i"
                                        v-show="shouldShow(duckId)"
                                        class="w-[9rem] h-[9rem] lg:w-[10rem] lg:h-[10rem]">
                                        <p v-if="!getSet(duckId)">...Loading data...</p>
                                        <div
                                            v-else
                                            :class="`h-full w-full cursor-pointer overflow-hidden rounded transition-all duration-300 ${hoverLock == duckId ? 'border-grad-dark' : 'border-transparent hover:border-grad-dark/50'} border-4 flex justify-center items-center`"
                                            @mouseenter="setHoveredDuck(duckId)"
                                            @click="hoverLock = duckId">
                                            <img :src="backendManager.getRoute(`set/${'starknet-testnet'}/${getSet(duckId)!.id}/small_preview.jpg`)">
                                        </div>
                                    </div>
                                    <p v-if="iScroll < 200">(loading more)</p>
                                </div>
                                <div class="relative min-h-[30rem]">
                                    <div class="sticky top-[9.2rem] z-5 flex justify-center w-full">
                                        <div class="max-w-[26rem] relative w-full">
                                            <Transition name="fade-hoverlock">
                                                <AuctionDetailCard
                                                    :key="hoverLock"
                                                    v-if="auctionDataStore['starknet-testnet']?.[hoverLock]?.auctionData(hoverLock)?._data"
                                                    :class="`transition-all duration-500 origin-bottom-left ${ hoveredAuction && hoveredAuction !== hoverLock ? 'rotate-[3deg]' : '' }`"
                                                    :auction-data="auctionDataStore['starknet-testnet'][hoverLock].auctionData(hoverLock)._data"
                                                    :expand="true"
                                                    :title="getSet(hoverLock)!.name"
                                                    :subtitle="getSet(hoverLock)!.description"
                                                    :status="'LOADED'"/>
                                            </Transition>
                                            <!-- This item exists solely so that the opacity transition doesn't reveal the background but stays on a card,
                                            since that looks better -->
                                            <Transition name="fake-fadeout">
                                                <AuctionDetailCard
                                                    v-if="hoveredAuction && hoveredAuction !== hoverLock && auctionDataStore['starknet-testnet']?.[hoveredAuction]?.auctionData(hoveredAuction)?._data"
                                                    :class="`!absolute top-0`"
                                                    :auction-data="auctionDataStore['starknet-testnet'][hoveredAuction].auctionData(hoveredAuction)._data"
                                                    :title="getSet(hoveredAuction)!.name"
                                                    :subtitle="getSet(hoveredAuction)!.description"
                                                    :status="'LOADED'"/>
                                            </Transition>
                                            <Transition name="fade">
                                                <AuctionDetailCard
                                                    :key="hoveredAuction"
                                                    v-if="hoveredAuction && hoveredAuction !== hoverLock && auctionDataStore['starknet-testnet']?.[hoveredAuction]?.auctionData(hoveredAuction)?._data"
                                                    :class="`!absolute top-0 ${hoverLock ? '!shadow-xl' : ''}`"
                                                    :auction-data="auctionDataStore['starknet-testnet'][hoveredAuction].auctionData(hoveredAuction)._data"
                                                    :title="getSet(hoveredAuction)!.name"
                                                    :subtitle="getSet(hoveredAuction)!.description"
                                                    :status="'LOADED'"/>
                                            </Transition>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <p class="text-center">Loading ducks</p>
                    </template>
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
