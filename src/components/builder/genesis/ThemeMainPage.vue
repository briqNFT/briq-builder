<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';
const route = useRoute();

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata['starknet_city']?._data );
const themeBoxes = computed(() => genesisStore.boxes['starknet_city']);
watchEffect(() => themeBoxes.value?._data?.map((x: string) => genesisStore.saledata[x]._data));

const status = computed(() => themeBoxes.value._status);

// Wait until we've loaded sale data to show boxes.
const boxes = computed(() => themeBoxes.value?._data?.filter((x: string) => genesisStore.saledata[x]._data));

</script>

<style scoped>
.theme-main-page {
    @apply bg-gray-100 text-black;
}
</style>

<template>
    <div class="theme-main-page">
        <Header/>
        <div class="container m-auto">
            <div class="flex flex-col justify-around items-center h-[30rem] bg-black text-white rounded-md my-4">
                <h1 class="text-center">{{ themeData.name || route.params.theme }}</h1>
                <p>{{ themeData.description }}</p>
            </div>
            <div class="container m-auto max-w-4xl">
                <p class="text-center my-12 font-semibold text-lg">Sale starting soon</p>
                <div class="grid grid-cols-4 auction-countdown gap-12">
                    <div
                        v-for="i in [['Days', 2], ['Hours', 1], ['Minutes', 24], ['Seconds', 43]]" :key="i[0]">
                        <div class="flex justify-center gap-4">
                            <p class="text-max font-bold flex-1 basis-1 px-4 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[0] }}</p>
                            <p class="text-max font-bold flex-1 basis-1 px-4 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[1] }}</p>
                        </div>
                        <p class="text-center uppercase text-xl font-bold mt-4">{{ i[0] }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="container m-auto">
            <BoxListing v-if="status === 'LOADED' && boxes.length" :boxes="boxes"/>
            <p v-else class="text-center">Loading boxes</p>
        </div>
        <Footer/>
    </div>
</template>
