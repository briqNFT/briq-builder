<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import ToggleParagraph from '@/components/generic/ToggleParagraph.vue';

import { useThemeURLs } from './ThemeUrlComposable';
import { backendManager } from '@/Backend';
import { APP_ENV } from '@/Meta';
import { themeSetsDataStore, themeSetsOwnerStore, useSearch } from '@/builder/DucksSale';
import DuckDetailCard from './DuckDetailCard.vue';
import type { CHAIN_NETWORKS } from '@/chain/Network';
import Toggle from '@/components/generic/Toggle.vue';
import { addressToStarknetId } from '@/chain/StarknetId';

const route = useRoute();
const network: CHAIN_NETWORKS = APP_ENV === 'prod' ? 'starknet-mainnet' : 'starknet-testnet-dojo';

const themeName = computed(() => 'ducks_everywhere');

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );

const themeSets = computed(() => themeSetsDataStore[network][themeName.value]);

const themeStatus = computed(() => {
    if (genesisStore.themedata[themeName.value]?._status !== 'LOADED')
        return genesisStore.themedata[themeName.value]?._status;
    return themeSets.value._status;
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

const themeTokens = computed(() => Object.keys(themeSets.value._data || {}).sort(sortDucks));
const filteredTokens = computed(() => themeTokens.value?.filter(shouldShow) || []);

const tokensByOwner = computed(() => {
    const ret: Record<string, string[]> = {};
    for (const tokenId of filteredTokens.value) {
        const owner = getOwner(tokenId);
        if (!owner)
            continue;
        if (!ret[owner])
            ret[owner] = [];
        ret[owner].push(tokenId);
    }
    return ret;
});

const ownerName = (address: string) => {
    if (addressToStarknetId[network][address]._data)
        return addressToStarknetId[network][address]._data;
    return address;
}

const getSet = (tokenId: string) => themeSets.value._data?.[tokenId];
const getOwner = (tokenId: string) => themeSetsOwnerStore[network][themeName.value]._data?.[tokenId];

const { searchBar, sortOrder, groupBy } = useSearch();
const isGroupedByOwner = computed(() => groupBy.value === 'owner');

const shouldShow = (tokenId: string) => {
    if (!searchBar.value)
        return true;
    const name = getSet(tokenId)?.name;
    if (name && name.toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1)
        return true;
    return ownerName(getOwner(tokenId))?.toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1;
};

const sortDucks = (a: string, b: string) => {
    return _sortDucks(sortOrder.value)(a, b);
}

const _sortDucks = (sorting: any) => (a: string, b: string) => {
    return (getSet(a)?.name || a).localeCompare(getSet(b)?.name || b);
}

// Make sure to scroll up when searching or behaviour gets a bit weird.
const ducksListing = ref(null as unknown as HTMLElement);
watchEffect(() => {
    if (!ducksListing.value)
        return;
    searchBar.value;
    if (ducksListing.value.getBoundingClientRect().top < -100)
        window.scrollTo(0, ducksListing.value.getBoundingClientRect().top + window.scrollY - 200);
})


const hoveredAuction = ref(undefined as undefined | string);
const hoverLock = ref(undefined as undefined | string);

// Select an NFT when we've loaded the data.
const selectFirstDuck = () => {
    const stopHandle = watchEffect(() => {
        if (!themeTokens.value.length)
            return;
        setHoveredDuck(themeTokens.value[0]);
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
let upcomingHover = undefined as string | undefined;
let timeout: unknown;
const setHoveredDuck = (tokenId: string | undefined) => {
    upcomingHover = tokenId;
    if (hoverLock.value === hoveredAuction.value) {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => {
            hoveredAuction.value = upcomingHover;
        }, 100);
    } else
        hoveredAuction.value = upcomingHover;
};

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
                    <div class="tall-sm:sticky top-[calc(3.5rem-1px)] md:top-[calc(4rem-1px)] z-10 my-2 bg-background py-3 md:py-6 w-full">
                        <div class="max-w-[1600px] px-2 md:px-8 m-auto flex gap-2 md:flex-nowrap flex-wrap">
                            <p class="relative flex items-center flex-1 min-w-[16rem] max-w-[38rem]">
                                <input class="w-full" type="text" v-model="searchBar" placeholder="Search for a specific duck">
                                <i class="fa-solid fa-magnifying-glass absolute right-3"/>
                            </p>
                            <div class="hidden sm:flex gap-2">
                                <Btn secondary class="px-2 font-normal text-sm" @click="groupBy ? groupBy = undefined : groupBy = 'owner'">
                                    <Toggle v-model="isGroupedByOwner" class="mr-2 w-8 pointer-events-none"/>
                                    Group by owner
                                </Btn>
                            </div>
                        </div>
                    </div>
                    <div class="max-w-[1600px] px-2 md:px-8 m-auto mt-3" ref="ducksListing">
                        <div
                            class="grid gap-4 grid-cols-[min-content_20rem] tall-md:grid-cols-[min-content_minmax(16rem,auto)]">
                            <div
                                class="grid sm:gap-2 lg:gap-4 content-start
                                grid-cols-[repeat(1,5rem)] sm:grid-cols-[repeat(2,9rem)] md:grid-cols-[repeat(3,9rem)]
                                lg:grid-cols-[repeat(4,10rem)] xl:grid-cols-[repeat(5,10rem)] 2xl:grid-cols-[repeat(6,10rem)]"
                                @pointerleave="hoverLock && setHoveredDuck(undefined)">
                                <template v-if="isGroupedByOwner">
                                    <template v-for="tokens, owner in tokensByOwner" :key="owner">
                                        <h4 class="col-span-full break-all font-normal">Owned by {{ ownerName(owner) }}</h4>
                                        <div
                                            v-for="duckId, i in tokensByOwner[owner]" :key="duckId + i"
                                            v-show="shouldShow(duckId)"
                                            class="w-[5rem] h-[5rem] sm:w-[9rem] sm:h-[9rem] lg:w-[10rem] lg:h-[10rem]">
                                            <p v-if="!getSet(duckId)">...Loading data...</p>
                                            <div
                                                v-else
                                                :class="`h-full w-full cursor-pointer overflow-hidden rounded transition-all duration-300 ${hoverLock == duckId ? 'border-grad-dark' : 'border-transparent hover:border-grad-dark/50'} border-4 flex justify-center items-center`"
                                                @mouseenter="setHoveredDuck(duckId)"
                                                @click="hoverLock = duckId">
                                                <img :src="backendManager.getRoute(`set/${network}/${getSet(duckId)!.id}/small_preview.jpg`)">
                                            </div>
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <div
                                        v-for="duckId, i in themeTokens" :key="duckId + i"
                                        v-show="shouldShow(duckId)"
                                        class="w-[5rem] h-[5rem] sm:w-[9rem] sm:h-[9rem] lg:w-[10rem] lg:h-[10rem]">
                                        <p v-if="!getSet(duckId)">...Loading data...</p>
                                        <div
                                            v-else
                                            :class="`h-full w-full cursor-pointer overflow-hidden rounded transition-all duration-300 ${hoverLock == duckId ? 'border-grad-dark' : 'border-transparent hover:border-grad-dark/50'} border-4 flex justify-center items-center`"
                                            @mouseenter="setHoveredDuck(duckId)"
                                            @click="hoverLock = duckId">
                                            <img :src="backendManager.getRoute(`set/${network}/${getSet(duckId)!.id}/small_preview.jpg`)">
                                        </div>
                                    </div>
                                </template>
                                <h5 class="col-span-full" v-show="!filteredTokens.length">There are no ducks matching the filters you've entered</h5>
                            </div>
                            <div class="relative tall-sm:min-h-[30rem]">
                                <div class="sticky top-[4.3rem] tall-sm:top-[7.3rem] tall-sm:md:top-[9.2rem] z-5 flex justify-center w-full">
                                    <div v-if="!!themeSets._data" class="tall-sm:max-w-[26rem] tall-sm:min-h-[38rem] relative w-full">
                                        <Transition name="fade-hoverlock">
                                            <DuckDetailCard
                                                v-if="hoverLock"
                                                :key="hoverLock"
                                                :class="`!absolute top-0 transition-all duration-500 origin-bottom-left ${ hoveredAuction && hoveredAuction !== hoverLock ? 'rotate-[3deg]' : '' }`"
                                                :expand="true"
                                                :network="network"
                                                :theme="themeName"
                                                :token-id="hoverLock"/>
                                        </Transition>
                                        <!-- This item exists solely so that the opacity transition doesn't reveal the background but stays on a card,
                                        since that looks better -->
                                        <Transition name="fake-fadeout">
                                            <DuckDetailCard
                                                v-if="hoveredAuction && hoveredAuction !== hoverLock"
                                                :class="`!absolute top-0`"
                                                :network="network"
                                                :theme="themeName"
                                                :token-id="hoveredAuction"/>
                                        </Transition>
                                        <Transition name="fade">
                                            <DuckDetailCard
                                                :key="hoveredAuction"
                                                v-if="hoveredAuction && hoveredAuction !== hoverLock"
                                                :class="`!absolute top-0 ${hoverLock ? '!shadow-xl' : ''}`"
                                                :network="network"
                                                :theme="themeName"
                                                :token-id="hoveredAuction"/>
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
