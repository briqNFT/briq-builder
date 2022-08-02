<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import StarknetPlanetWaitingTheme from '@/assets/genesis/starknet_planet_waiting_theme.png?url';
import StarknetPlanetTheme from '@/assets/genesis/starknet_planet_theme.png?url';
import starknet_planet_logo from '@/assets/genesis/starknet_planet_logo.png?url';

const route = useRoute();

const themeName = computed(() => route.params.theme as string);

const genesisStore = useGenesisStore();

const themeStatus = computed(() => genesisStore.themedata[themeName.value]?._status );
const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );

const themeBoxes = computed(() => genesisStore.boxes[themeName.value]);
watchEffect(() => themeBoxes.value?._data?.map((x: string) => genesisStore.saledata[x]._data));

const status = computed(() => themeBoxes.value._status);

// Wait until we've loaded sale data to show boxes.
const auctionBoxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.total_quantity === 1
}));

const dutchBoxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.total_quantity > 1
}));

const now = ref(Date.now() / 1000);
setInterval(() => now.value = Date.now() / 1000, 1000);
const saleStartsInSeconds = computed(() => themeData.value?.sale_start - now.value?? 0);
const saleStartsIn = computed(() => {
    let tl = saleStartsInSeconds.value;
    const days = Math.floor(tl / 24 / 3600);
    tl -= days * 24 * 3600;
    const hours = Math.floor(tl / 3600);
    tl -= hours * 3600;
    const minutes = Math.floor(tl / 60);
    tl -= minutes * 60;
    const seconds = Math.floor(tl);
    return [['Days', days], ['Hours', hours], ['Minutes', minutes], ['Seconds', seconds]];
});

const isLive = computed(() => saleStartsInSeconds.value <= 0 );

</script>

<style scoped>
.theme-bg::after {
    content: "";
    @apply absolute top-0 left-[50%] translate-x-[-50%] w-full h-full max-w-[1440px] min-w-[1280px];
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 90%, rgba(0, 0, 0, 1) 100%),
        linear-gradient(90deg, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.2) 100%),
        linear-gradient(-90deg, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.2) 100%),
        linear-gradient(90deg, rgba(0, 0, 0, 0) 85%, rgba(0, 0, 0, 1) 100%),
        linear-gradient(-90deg, rgba(0, 0, 0, 0) 85%, rgba(0, 0, 0, 1) 100%),
        linear-gradient(120deg, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.6) 100%),
        linear-gradient(-120deg, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.6) 100%)
}
</style>

<template>
    <div class="">
        <Header/>
        <div>
            <div class="bg-black text-white">
                <div class="h-[585px] relative">
                    <div class="absolute w-full h-full theme-bg">
                        <img :src="isLive ? StarknetPlanetTheme : StarknetPlanetWaitingTheme" alt="logo" class="absolute max-w-none maw-h-none top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
                    </div>
                    <div class="min-h-[500px] container py-16 m-auto px-2 md:px-8 lg:px-16 relative z-1">
                        <!--<h1 class="text-left font-black uppercase my-16">{{ themeData.name || route.params.theme }}</h1>-->
                        <h1><img class="pl-[5rem]" :src="starknet_planet_logo" :alt="themeData.name || route.params.theme"></h1>
                        <div class="my-16">
                            <h3>{{ themeData.tagline ?? "Build the city of the future (placeholder)" }}</h3>
                            <p>{{ themeData.description }}</p>
                        </div>
                        <template v-if="!isLive">
                            <div class="w-[340px] my-8 px-4 pt-2 pb-4 border border-accent rounded backdrop-blur-md backdrop-brightness-50">
                                <p class="my-2 text-sm">Sale starting soon</p>
                                <div class="grid grid-cols-4 auction-countdown gap-2">
                                    <div
                                        v-for="i in saleStartsIn" :key="i[0]"
                                        class=" h-full w-full bg-white bg-opacity-10 rounded text-center py-2">
                                        <p class="text-xl">{{ i[1] }}</p>
                                        <p class="text-xs capitalize">{{ i[0] }}</p>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <template v-if="isLive">
                <div class="mt-8">
                    <template v-if="themeStatus === 'LOADED'">
                        <div class="container m-auto">
                            <template v-if="status == 'LOADED'">
                                <template v-if="auctionBoxes.length">
                                    <h3>Auctions for unique NFTs ({{ auctionBoxes.length }})</h3>
                                    <BoxListing :boxes="auctionBoxes" :mode="saleStartsInSeconds < 0 ? 'AUTO' : 'PRESALE' "/>
                                </template>
                                <template v-if="dutchBoxes.length">
                                    <h3>Instant Purchase ({{ dutchBoxes.length }})</h3>
                                    <BoxListing :boxes="dutchBoxes" :mode="saleStartsInSeconds < 0 ? 'AUTO' : 'PRESALE' "/>
                                </template>
                            </template>
                            <template v-else>
                                <p class="text-center">Loading boxes</p>
                            </template>
                        </div>
                    </template>
                    <template v-else-if="themeStatus === 'FETCHING'">
                        <div class="h-[400px] flex justify-center items-center"><p class="text-xl font-medium text-darkest italic">Loading collection <i class="fas fa-spinner animate-spin-slow"/></p></div>
                    </template>
                    <template v-else-if="themeStatus === 'ERROR'">
                        <div class="h-[400px] flex justify-center items-center flex-col">
                            <p class="text-xl font-medium my-4">Error loading data</p>
                            <p class="rounded bg-darker font-mono text-copy border-darkest border p-4">{{ genesisStore.themedata[themeName]._error }}</p>
                        </div>
                    </template>
                </div>
            </template>
            <div class="bg-black text-white">
                <div class="container max-w-[800px] m-auto py-16">
                    <h2 class="text-center">FAQ</h2>
                    <div class="flex flex-col gap-8">
                        <div>
                            <h3>Some Question Here bb ? </h3>
                            <p>Lorem ipsum dolor it sametLorem ips Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it same tLorem ipsum um tLorem ipsum um </p>
                        </div>
                        <div>
                            <h3>Some Question Here bb ? </h3>
                            <p>Lorem ipsum dolor it sametLorem ips Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it same tLorem ipsum um tLorem ipsum um </p>
                        </div>
                        <div>
                            <h3>Some Question Here bb ? </h3>
                            <p>Lorem ipsum dolor it sametLorem ips Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it same tLorem ipsum um tLorem ipsum um </p>
                        </div>
                        <div>
                            <h3>Some Question Here bb ? </h3>
                            <p>Lorem ipsum dolor it sametLorem ips Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it sametLorem ipsum Lorem ipsum dolor it same tLorem ipsum um tLorem ipsum um </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>
