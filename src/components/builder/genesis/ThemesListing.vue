<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed, ref } from 'vue';
import { backendManager } from '@/Backend';
import { CHAIN_NETWORKS, getCurrentNetwork } from '@/chain/Network';

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

</script>


<style scoped>
</style>

<template>
    <Header/>
    <div class="container m-auto">
        <h1>Themes</h1>
        <div class="grid grid-cols-3 gap-4 my-8">
            <RouterLink v-for="theme of themeList" :key="theme" :to="{ name: 'Theme', params: { theme: theme } }">
                <div class="h-[15rem] flex flex-col justify-center items-center gap-8 text-white bg-black rounded-lg">
                    <h2>{{ genesisStore.themedata[theme]._data?.name }}</h2>
                    <p>{{ genesisStore.themedata[theme]._data?.description }}</p>
                </div>
            </RouterLink>
        </div>
    </div>
    <Footer/>
</template>
