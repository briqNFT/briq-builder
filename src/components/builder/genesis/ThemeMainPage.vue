<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';
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
    return genesisStore.saledata[x]._data.total_quantity === 1
}));

const dutchBoxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata[x]._data.total_quantity > 1
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

</script>

<style scoped>
.theme-main-page {
    @apply bg-gray-100 text-black;
}
</style>

<template>
    <div class="theme-main-page">
        <Header/>
        <template v-if="themeStatus === 'LOADED'">
            <div class="container m-auto">
                <div class="flex flex-col justify-around items-center h-[30rem] bg-black text-white rounded-md my-4">
                    <h1 class="text-center">{{ themeData.name || route.params.theme }}</h1>
                    <p>{{ themeData.description }}</p>
                </div>
                <div v-if="saleStartsInSeconds > 0" class="container m-auto max-w-4xl my-12">
                    <p class="text-center my-12 font-semibold text-lg">Sale starting soon</p>
                    <div class="grid grid-cols-4 auction-countdown gap-12">
                        <div
                            v-for="i in saleStartsIn" :key="i[0]">
                            <div class="flex justify-center gap-4">
                                <p class="text-max font-bold flex-1 basis-1 w-8 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[0] }}</p>
                                <p class="text-max font-bold flex-1 basis-1 w-8 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[1] }}</p>
                            </div>
                            <p class="text-center uppercase text-xl font-bold mt-4">{{ i[0] }}</p>
                        </div>
                    </div>
                </div>
            </div>
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
        <Footer/>
    </div>
</template>
