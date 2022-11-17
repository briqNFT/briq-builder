<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import ProgressBar from '@/components/generic/ProgressBar.vue';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';
import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';
import { useBoxData } from '@/builder/BoxData';
import { userBoxesStore } from '@/builder/UserBoxes';
import { getCurrentNetwork } from '@/chain/Network';
import ItemActivity from './ItemActivity.vue';
import { maybeStore } from '@/chain/WalletLoading';

import BriqsImg from '@/assets/genesis/briqs.png';

const route = useRoute();
const genesisStore = useGenesisStore();

const box_id = computed(() => `${route.params.theme}/${route.params.box}`);

const {
    itemQuery,
    item,
    saleQuery,
    saledata,
    getActualMode,
    durationLeft,
} = useBoxData(box_id.value);


const attributes = computed(() => {
    if (!item.value)
        return [];
    const props = item.value.properties;
    return [
        { name: 'Serial Number', value: `#${item.value.token_id}` },
        { name: 'Theme', value: genesisStore.themedata[route.params.theme as string]?._data?.name },
        { name: 'Artist', value: props.artist.value },
        { name: 'Year', value: new Date(props.date.value).toLocaleDateString('en-uk', { year: 'numeric', month: 'short' }) },
        { name: '# of briqs', value: props.nb_briqs.value },
    ]
});

const nbItems = computed(() => {
    return userBoxesStore?.current?.availableBoxes?.filter(x => x === box_id.value).length ?? '...';
});

const view = ref(('PREVIEW') as 'PREVIEW' | 'SET' | 'BOOKLET');
</script>

<template>
    <GenericItemPage
        :status="itemQuery?._status"
        :attributes="attributes">
        <template #full-image="{ status }">
            <div class="relative h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                <template v-if="status === 'LOADED'">
                    <div class="flex justify-center items-center h-full w-full select-none">
                        <div v-show="view === 'PREVIEW'" class="w-full h-full p-4 lg:p-8 xl:p-16 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBoxRoute(box_id)}), url(${genesisStore.coverBoxRoute(box_id, true)})` }"/>
                        <div v-show="view === 'BOOKLET'" class="w-full h-full p-4 xl:p-8 xl:pb-10 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(box_id)}), url(${genesisStore.coverBookletRoute(box_id, true)})` }"/>
                        <div v-show="view === 'SET'" class="w-full h-full p-4 lg:p-16 xl:p-24 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverItemRoute(box_id)}), url(${genesisStore.coverItemRoute(box_id, true)})` }"/>
                        <div class="absolute top-4 left-4 flex flex-col gap-4">
                            <Btn no-style :class="`${ view === 'PREVIEW' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='PREVIEW'"><img class="max-w-full max-h-full" :src="genesisStore.coverBoxRoute(box_id, true)"></Btn>
                            <Btn no-style :class="`${ view === 'BOOKLET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='BOOKLET'"><img class="max-w-full max-h-full" :src="genesisStore.coverBookletRoute(box_id, true)"></Btn>
                            <Btn no-style :class="`${ view === 'SET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='SET'"><img class="max-w-full max-h-full" :src="genesisStore.coverItemRoute(box_id, true)"></Btn>
                        </div>
                    </div>
                </template>
                <template v-else-if="status === 'FETCHING'">
                    <p>Loading image</p>
                </template>
                <div v-else><p>Error while loading data</p></div>
            </div>
        </template>
        <template #default>
            <h1>{{ item?.name }}</h1>
            <h5 class="mt-0">Unopened Box<span class="font-normal"> - {{ genesisStore.themedata[route.params.theme as string]?._data?.name }}</span></h5>
            <p class="mt-6 mb-8 whitespace-pre-line">{{ item?.description }}</p>
            <div>
                <p>This box contains:</p>
                <div class="mt-1 mb-2 flex flex-nowrap items-center">
                    <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-10 brightness-[98%]" :src="genesisStore.coverBookletRoute(box_id, true)"></p>
                    <p>One instruction <span class="font-medium">booklet NFT</span> that you can use to create an Official&nbsp;Set</p>
                </div>
                <div class="flex flex-nowrap items-center">
                    <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-7" :src="BriqsImg"></p>
                    <p>{{ item?.nb_briqs }} <span class="font-medium">briqs</span>, enough to build the Official&nbsp;Set and then more</p>
                </div>
            </div>
            <p class="mt-4">Your set is still under blister, unbox it to see what’s inside or keep it closed.<br>Note that once it’s opened, you can’t go back.</p>
            <!--
            <h2 class="mt-6">Unopened box</h2>

            -->
            <div class="rounded border border-grad-light overflow-hidden mt-6 mb-10">
                <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                    <div>
                        <h5 class="font-normal text-grad-dark">Each contains</h5>
                        <p class="text-lg font-semibold pt-1">{{ item?.nb_briqs }} briqs & 1 booklet</p>
                    </div>
                    <RouterLink :to="{ name: 'Unboxing', params: { theme: route.params.theme, box: route.params.box } }"><Btn class="h-full text-md px-6">Unbox</Btn></RouterLink>
                </div>
                <div class="p-6 py-4 flex flex-col gap-4">
                    <p class="text-grad-dark">Currently owned: <span class="text-grad-darkest">{{ nbItems }}</span></p>
                </div>
            </div>
            <div>
                <h4>See on</h4>
                <p class="flex gap-3 mt-4 mb-10">
                    <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                    <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                </p>
            </div>
            <div v-if="box_id">
                <Suspense>
                    <ItemActivity type="box" :user="maybeStore?.user_id" :network="(route.params.network as string) || getCurrentNetwork()" :item="box_id"/>
                </Suspense>
            </div>
        </template>
    </GenericItemPage>
</template>
