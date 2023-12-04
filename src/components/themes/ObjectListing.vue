<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue';

import HoverCard from '@/components/themes/HoverCard.vue';

import { themeObjects, themeSetsDataStore, themeSetsOwnerStore, useSearch } from '@/builder/DucksSale';
import Toggle from '@/components/generic/Toggle.vue';
import { addressToStarknetId } from '@/chain/StarknetId';
import { getCurrentNetwork } from '@/chain/Network';
import { useGenesisStore } from '@/builder/GenesisStore';
import { bookletDataStore } from '@/builder/BookletData';

////////////////////////////////
// Helpers

const genesisStore = useGenesisStore();

const duckData = computed(() => themeSetsDataStore[getCurrentNetwork()][themeName.value]);

const getSet = (tokenId: string) => {
    if (duckData.value._status === 'FETCHING')
        return undefined;
    if (duckData.value._status === 'LOADED' && duckData.value._data?.[tokenId])
        return duckData.value._data?.[tokenId];
    return bookletDataStore[getCurrentNetwork()][tokenId]._data;
}
const getOwner = (tokenId: string) => themeSetsOwnerStore[getCurrentNetwork()][themeName.value]._data?.[getSet(tokenId)?.id];

const ownerName = (address: string) => {
    if (addressToStarknetId[getCurrentNetwork()][address]._data)
        return addressToStarknetId[getCurrentNetwork()][address]._data;
    return address;
}

////////////////////////////////
// Data for the theme

const themeStatus = computed(() => {
    return genesisStore.themedata[themeName.value]?._status || 'FETCHING';
});

const props = defineProps<{
    themeName: string;
}>();

const themeName = computed(() => props.themeName);

const objectIds = computed(() => Object.keys(themeObjects[getCurrentNetwork()][themeName.value]._data || {}).sort(sortDucks));

const filteredTokens = computed(() => objectIds.value?.filter(shouldShow) || []);

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

////////////////////////////////
// Search bar & sorting stuff.
const { searchBar, sortOrder, groupBy } = useSearch();
const isGroupedByOwner = computed(() => groupBy.value === 'owner');

const shouldShow = (tokenId: string) => {
    if (!searchBar.value)
        return true;
    const name = getSet(tokenId)?.name;
    if (name && name.toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1)
        return true;

    return (ownerName(getOwner(tokenId)) || '').toLowerCase().indexOf(searchBar.value.toLowerCase()) !== -1;
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

////////////////////////////////
// Hovering card stuff

const hoveredAuction = ref(undefined as undefined | string);
const hoverLock = ref(undefined as undefined | string);

// Select an NFT when we've loaded the data.
const selectFirstDuck = () => {
    const stopHandle = watchEffect(() => {
        if (!objectIds.value.length)
            return;
        setHoveredDuck(objectIds.value[0]);
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

<template>
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
                <p class="flex items-center justify-center pl-2 text-grad-dark">{{ filteredTokens.length }} / {{ objectIds.length }}</p>
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
                                    <img :src="genesisStore.coverItemRoute(duckId, true)">
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-else>
                        <div
                            v-for="duckId, i in objectIds" :key="duckId + i"
                            v-show="shouldShow(duckId)"
                            class="w-[5rem] h-[5rem] sm:w-[9rem] sm:h-[9rem] lg:w-[10rem] lg:h-[10rem]">
                            <div
                                :class="`h-full w-full cursor-pointer overflow-hidden rounded transition-all duration-300 ${hoverLock == duckId ? 'border-grad-dark' : 'border-transparent hover:border-grad-dark/50'} border-4 flex justify-center items-center`"
                                @mouseenter="setHoveredDuck(duckId)"
                                @click="hoverLock = duckId">
                                <img :src="genesisStore.coverItemRoute(duckId, true)">
                            </div>
                        </div>
                    </template>
                    <h5 class="col-span-full" v-show="!filteredTokens.length">There are no ducks matching the filters you've entered</h5>
                </div>
                <HoverCard
                    :status="themeObjects[getCurrentNetwork()][themeName.value]._status"
                    :network="getCurrentNetwork()"
                    :theme-name="themeName"
                    :hovered-auction="hoveredAuction"
                    :hover-lock="hoverLock"/>
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
</template>