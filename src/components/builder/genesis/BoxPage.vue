<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import ProgressBar from '@/components/generic/ProgressBar.vue';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';
import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';
import { useBoxData } from '@/builder/BoxData';
import { userBoxesStore } from '@/builder/UserBoxes';

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
        { name: 'Creator', value: props.creator.value },
        { name: 'Year', value: new Date(props.date.value).getFullYear() },
        { name: '# of briqs', value: props.nb_briqs.value },
    ]
});

const nbItems = computed(() => {
    return userBoxesStore.current?.availableBoxes?.filter(x => x === box_id.value).length ?? '...';
});
</script>

<template>
    <GenericItemPage
        :status="itemQuery?._status"
        :attributes="attributes">
        <template #image>
            <img class="max-h-full p-8" :src="genesisStore.coverBoxRoute(box_id)">
        </template>
        <template #default>
            <h1>{{ item?.name }}</h1>
            <h5 class="mt-2">Box</h5>
            <p class="mt-6 mb-8">{{ item?.description }}</p>
            <h2>Unopened box</h2>
            <p class="mb-4">Your set is still under blister, Unbox it to see what’s inside or keep it closed. Note that once it’s done you can’t go back.</p>
            <div class="rounded border border-grad-light overflow-hidden mt-6 mb-10">
                <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                    <div>
                        <h5 class="font-normal text-grad-dark">Bought at</h5>
                        <p class="text-xl font-semibold pt-1">1.35 ETH</p>
                    </div>
                    <RouterLink :to="{ name: 'Unboxing', params: { theme: route.params.theme, box: route.params.box } }"><Btn class="h-full text-md px-6">Unbox</Btn></RouterLink>
                </div>
                <div class="p-6 py-4 flex flex-col gap-4">
                    <p class="font-semibold">{{ nbItems }}<span class="font-medium"> in inventory</span></p>
                </div>
            </div>
            <div>
                <h4>See on</h4>
                <p class="flex gap-3 mt-4 mb-10">
                    <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                    <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                </p>
            </div>
        </template>
    </GenericItemPage>
</template>
