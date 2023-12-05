<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import { useThemeURLs } from '@/components/themes/ThemeUrlComposable';
import { getCurrentNetwork } from '@/chain/Network';
import { getBoxMarketplaceUrl, getBookletMarketplaceUrl, getSetMarketplaceUrl } from '@/chain/Marketplaces';

const route = useRoute();

const themeName = computed(() => route.params.theme as string);

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );
const themeBoxes = computed(() => genesisStore.boxes[themeName.value]);

const themeStatus = computed(() => themeBoxes.value?._status);

const status = computed(() => themeBoxes.value._status);

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

</script>

<style scoped>
.presentation > a {
    @apply basis-1/3 max-h-[20rem]
}

.presentation > a > div {
    @apply basis-1/3 max-h-[20rem] relative h-full flex items-center justify-center bg-grad-lightest rounded border border-grad-lighter p-2 transition-all
}
.presentation > a > div:hover {
    @apply translate-y-[-0.5rem] transition-all
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
                    <div class="min-h-[500px] container py-[3.2rem] m-auto px-2 md:px-8 lg:px-[3.375rem] relative z-1">
                        <!--<h1 class="text-left font-black uppercase my-16">{{ themeData.name || route.params.theme }}</h1>-->
                        <h1><img class="min-h-[17rem]" :srcset="themeLogoSrcSet(themeName)" :alt="themeData?.name || (route.params.theme as string)"></h1>
                    </div>
                </div>
            </div>
            <div class="mb-8">
                <template v-if="themeStatus === 'LOADED'">
                    <div class="container m-auto mt-8">
                        <template v-if="status == 'LOADED'">
                            <div class="presentation flex gap-8">
                                <a :href="getBoxMarketplaceUrl('pyramid', getCurrentNetwork(), 'briqmas')"><div>
                                    <h2 class="absolute top-0 left-0 translate-x-[-20%] bg-grad-lightest border-2 px-4 py-2 rotate-[-20deg] rounded-lg shadow-sm">Buy a Box</h2>
                                    <img :src="genesisStore.coverBoxRoute(themeBoxes._data![0], false)" alt="box" class="w-auto h-full object-contain">
                                </div></a>
                                <a :href="getBookletMarketplaceUrl('pyramid', getCurrentNetwork(), 'briqmas')"><div>
                                    <h2 class="absolute top-0 left-0 translate-x-[-20%] bg-grad-lightest border-2 px-4 py-2 rotate-[-20deg] rounded-lg shadow-sm">Open it</h2>
                                    <img :src="genesisStore.coverBookletRoute(themeBoxes._data![0], false)" alt="box" class="w-auto h-full object-contain">
                                </div></a>
                                <a :href="getSetMarketplaceUrl('pyramid', getCurrentNetwork(), 'briqmas')"><div>
                                    <h2 class="absolute top-0 left-0 translate-x-[-20%] bg-grad-lightest border-2 px-4 py-2 rotate-[-20deg] rounded-lg shadow-sm">Build your Set</h2>
                                    <img :src="genesisStore.coverItemRoute(themeBoxes._data![0], false)" alt="box" class="w-auto h-full object-contain">
                                </div></a>
                            </div>
                        </template>
                        <template v-else>
                            <p class="text-center">Loading boxes</p>
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
            </div>
        </div>
        <Footer/>
    </div>
</template>
