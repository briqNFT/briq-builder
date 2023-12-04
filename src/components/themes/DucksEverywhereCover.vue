<script setup lang="ts">
import { computed } from 'vue';
import { useGenesisStore } from '@/builder/GenesisStore';

import { useThemeURLs } from '@/components/themes/ThemeUrlComposable';
import { useRoute } from 'vue-router';

const route = useRoute();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );

const themeName = computed(() => 'ducks_everywhere');

const genesisStore = useGenesisStore();


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

<template>
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
</template>
