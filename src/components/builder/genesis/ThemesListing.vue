<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import briqIcon from '@/assets/landing/briq-icon.svg';

import { useGenesisStore } from '@/builder/GenesisStore';
import { computed, ref } from 'vue';
import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';
import { useThemeURLs } from './ThemeUrlComposable';

const genesisStore = useGenesisStore();


const _themeList = ref([undefined as undefined | CHAIN_NETWORKS, null as null | Promise<string[]>]);
const themeList = computed(() => {
    if (!_themeList.value[0] || _themeList.value[0] !== getCurrentNetwork()) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        _themeList.value[0] = getCurrentNetwork();
        // eslint-disable-next-line vue/no-async-in-computed-properties
        backendManager.fetch(`v1/box_themes/list/${getCurrentNetwork()}`).then(x => {
            if (_themeList.value[0] === getCurrentNetwork())
                _themeList.value[1] = x;
        })
    }
    return (_themeList.value[1] || []) as string[];
});

const { themeSplashSrcSet } = useThemeURLs();

</script>


<style scoped>
.popOver > div {
    @apply relative top-0 transition-all duration-300;
}
.popOver:hover > div {
    @apply top-[-0.5rem] shadow-lg;
}
</style>

<template>
    <Header/>
    <div class="container m-auto min-h-screen">
        <h3 class="mt-10 mb-4">Themes</h3>
        <div class="mb-4 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <RouterLink class="popOver" v-for="theme of themeList" :key="theme" :to="{ name: 'Theme', params: { theme: theme } }">
                <div class="h-[16rem] flex flex-col justify-center items-center gap-2 rounded-lg relative">
                    <div class="absolute pointer-events-none overflow-hidden rounded-lg h-full w-full">
                        <img class="max-w-none max-h-none w-auto h-full relative top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]" :srcset="themeSplashSrcSet(theme)" :alt="`Theme splash for ${theme}`">
                    </div>
                    <h4 class="text-md text-white absolute bottom-3 left-4">{{ genesisStore.themedata[theme]._data?.name }}</h4>
                </div>
            </RouterLink>
            <div class="h-[16rem] flex flex-col justify-center items-center gap-2 bg-grad-lightest border border-grad-light rounded-lg">
                <p class="text-primary">New themes</p>
                <h3>COMING SOON</h3>
                <briqIcon class="scale-[1.5]"/>
            </div>
        </div>
    </div>
    <Footer/>
</template>
