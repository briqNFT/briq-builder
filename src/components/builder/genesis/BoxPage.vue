<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';

import UnframedLogo from '@/assets/marketplaces/logo-unframed-square.svg';
import ElementLogo from '@/assets/marketplaces/logo-element.svg';
import FlexLogo from '@/assets/marketplaces/logo-flex.png';
import PyramidLogo from '@/assets/marketplaces/logo-pyramid.png';

import { useBoxData } from '@/builder/BoxData';
import { getCurrentNetwork } from '@/chain/Network';
import ItemActivity from './ItemActivity.vue';
import { maybeStore } from '@/chain/WalletLoading';

import BriqsImg from '@/assets/genesis/briqs.png';
import { getBoxLink } from '@/chain/Marketplaces';

const route = useRoute();
const genesisStore = useGenesisStore();

const box_id = computed(() => `${route.params.theme}/${route.params.box}`);

const {
    itemQuery,
    item,
    saledata,
    nbOwned,
    isUnboxable,
    description,
} = useBoxData(box_id.value);

const nbSetBriqs = computed(() => (item.value?.nb_briqs || 0) - (item.value?.nb_briqs_extra || 0))

const attributes = computed(() => {
    if (!item.value)
        return [];
    const props = item.value.properties;
    return [
        { name: 'Serial Number', value: `#${item.value.token_id}` },
        { name: 'Theme', value: genesisStore.themedata[route.params.theme as string]?._data?.name },
        { name: 'Artist', value: props.artist.value },
        { name: 'Total Supply', value: saledata.value?.total_quantity },
        { name: 'Year', value: new Date(props.date.value).toLocaleDateString('en-uk', { year: 'numeric', month: 'short' }) },
        { name: '# of briqs', value: nbSetBriqs.value + (item.value?.nb_briqs_extra ? ` + ${item.value?.nb_briqs_extra} extra` : '') },
    ]
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
            <h5 class="mt-1">Unopened Box<span class="font-normal"> - {{ genesisStore.themedata[route.params.theme as string]?._data?.name }}</span></h5>
            <div v-if="route.params.theme === 'starknet_planet'" class="mb-8">
                <p class="mt-6 mb-4 font-medium whitespace-pre-line">{{ description?.[0] ?? 'Loading' }}</p>
                <p
                    v-for="par, i in description?.slice(1) || []" :key="i"
                    class="whitespace-pre-line mb-2 text-justify">
                    {{ par }}
                </p>
            </div>
            <div v-else class="mb-8 mt-6">
                <p
                    v-for="par, i in description || []" :key="i"
                    class="whitespace-pre-line mb-2 text-justify">
                    {{ par }}
                </p>
            </div>
            <template v-if="nbOwned > 0">
                <div>
                    <p>This box contains:</p>
                    <div class="mt-1 mb-2 flex flex-nowrap items-center">
                        <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-10 brightness-[98%]" :src="genesisStore.coverBookletRoute(box_id, true)"></p>
                        <p>One instruction <span class="font-medium">booklet NFT</span> that you can use to create an Official&nbsp;Set</p>
                    </div>
                    <div class="flex flex-nowrap items-center">
                        <p class="pointer-events-none select-none w-14 flex-none text-center"><img class="inline h-7" :src="BriqsImg"></p>
                        <p>{{ item?.nb_briqs }} <span class="font-medium"> briqs</span>, enough to build the Official&nbsp;Set and then more</p>
                    </div>
                </div>
                <div class="rounded border border-grad-light overflow-hidden mt-6 mb-10">
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                        <!--
                        <div>
                            <h5 class="font-normal text-grad-dark">Each contains</h5>
                            <p class="text-lg font-semibold pt-1">{{ item?.nb_briqs }} briqs & 1 booklet</p>
                        </div>
                        -->
                        <div class="flex flex-col justify-between">
                            <h5 class="font-normal text-grad-dark">Currently owned</h5>
                            <p class="text-xl font-semibold">{{ nbOwned === 1 ? '1 box' : `${nbOwned} boxes` }}</p>
                        </div>
                        <RouterLink v-if="isUnboxable" :to="{ name: 'Unboxing', params: { theme: route.params.theme, box: route.params.box } }">
                            <Btn class="h-auto text-md px-6 py-[1.125rem]">Unbox</Btn>
                        </RouterLink>
                        <template v-else>
                            <Btn
                                :disabled="true" tooltip="Purchase confirmation is still being processed on StarkNet. Please wait a little bit more!"
                                no-style class="h-auto text-sm pl-4 pr-6 py-4 bg-info-info rounded bg-opacity-10 text-info-info">
                                <i class="text-lg far fa-loader animate-spin mr-3"/> Pending transaction
                            </Btn>
                        </template>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p class="text-grad-dark font-medium text-xs">Your box is under blister. Once you open it, you can't go back.</p>
                    </div>
                </div>
            </template>
            <div>
                <h4>See on</h4>
                <p class="flex gap-3 mt-4 mb-10">
                    <a :href="getBoxLink('unframed', getCurrentNetwork(), route.params.theme, item?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><UnframedLogo class="w-4 mr-3"/> Unframed</Btn></a>
                    <a :href="getBoxLink('element', getCurrentNetwork(), route.params.theme, item?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><ElementLogo class="w-5 mr-3"/> Element</Btn></a>
                    <a :href="getBoxLink('flex', getCurrentNetwork(), route.params.theme, item?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><img :src="FlexLogo" class="w-7 mr-3"> Flex</Btn></a>
                    <a :href="getBoxLink('pyramid', getCurrentNetwork(), route.params.theme, item?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><img :src="PyramidLogo" class="w-8 mr-3"> Pyramid</Btn></a>
                </p>
            </div>
            <div v-if="box_id && nbOwned > 0">
                <Suspense>
                    <ItemActivity type="box" :user="maybeStore?.user_id" :network="(route.params.network as string) || getCurrentNetwork()" :item="box_id"/>
                </Suspense>
            </div>
        </template>
    </GenericItemPage>
</template>
