<script setup lang="ts">
import { computed } from 'vue';
import { backendManager } from '@/Backend';
import { themeSetsDataStore, themeSetsOwnerStore } from '@/builder/DucksSale';
import { Fetchable } from '@/DataFetching';
import { getSetLink } from '@/chain/Mintsquare';
import { addressToStarknetId } from '@/chain/StarknetId';
import { CHAIN_NETWORKS } from '@/chain/Network';

const props = defineProps<{
    network: CHAIN_NETWORKS,
    theme: string,
    tokenId: string,
    expand?: boolean,
}>();

const highImage = computed(() => backendManager.getPreviewUrl(props.tokenId, props.network));
const lowImage = computed(() => backendManager.getRoute(`set/${props.network}/${props.tokenId}/small_preview.jpg`))

const data = computed(() => {
    if (themeSetsDataStore[props.network][props.theme]._data) {
        const ret = new Fetchable<Record<string, any>>();
        ret._data = themeSetsDataStore[props.network][props.theme]._data?.[props.tokenId];
        ret._fetch = new Promise(res => res(null));
        ret._error = themeSetsDataStore[props.network][props.theme]._error;
        return ret;
    }
    return themeSetsDataStore[props.network][props.theme];
});

const ownerData = computed(() => {
    if (themeSetsOwnerStore[props.network][props.theme]._data) {
        const ret = new Fetchable<string>();
        ret._data = themeSetsOwnerStore[props.network][props.theme]._data?.[props.tokenId];
        ret._fetch = new Promise(res => res(null));
        ret._error = themeSetsOwnerStore[props.network][props.theme]._error;
        return ret;
    }
    return themeSetsOwnerStore[props.network][props.theme] as unknown as Fetchable<string>;
})

const currentOwner = computed(() => {
    if (!ownerData.value._data)
        return '...';
    if (addressToStarknetId[props.network][ownerData.value._data]._data)
        return addressToStarknetId[props.network][ownerData.value._data]._data;
    return ownerData.value._data.slice(0,8) + '...' + ownerData.value._data.slice(-5);
})
</script>

<style scoped>
.item-card p, .item-card :slotted(p) {
    @apply text-copy;
}
.item-card :slotted(.attribute) {
    @apply text-copy text-grad-dark;
}
</style>

<template>
    <div class="bg-white rounded-md shadow-sm item-card w-full">
        <div class="flex flex-col gap-2 h-full">
            <template v-if="data._status === 'LOADED'">
                <!-- Because we have gap-2 we need to remove 8px from bottom margin -->
                <p
                    :class="`rounded-md overflow-hidden min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-max bg-cover bg-origin-content bg-center bg-no-repeat`"
                    :style="{ backgroundImage: `url(${highImage}), url(${lowImage})` }">
                    <img class="min-h-0 min-w-0 max-h-full max-w-full invisible" :src="lowImage">
                </p>
                <h3 class="font-semibold text-lg px-4 overflow-x-auto">{{ data._data!.name }} </h3>
                <p class="px-4 flex justify-between text-md py-[1px]">{{ data._data!.description }}</p>
                <hr class="my-2">

                <div class="p-4 pt-0 flex flex-col gap-2">
                    <p class="flex justify-between">
                        <span class="text-grad-dark">Owner</span>
                        <span class="font-medium">{{ currentOwner }}</span>
                    </p>
                    <p v-if="expand" class="flex justify-between flex-wrap gap-2">
                        <RouterLink :to="{ name: 'UserCreation', params: { network: network, set_id: tokenId } }">
                            <Btn secondary>See details</Btn>
                        </RouterLink>
                        <a :href="getSetLink(network, tokenId)" target="_blank">
                            <Btn secondary>See on Mintsquare</Btn>
                        </a>
                    </p>
                    <p v-else class="flex justify-center text-grad-dark italic text-xs">
                        Click on the card to see more
                    </p>
                </div>
            </template>
            <template v-else-if="data._status === 'ERROR'">
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-xmark"/><span>Error while loading data</span></p>
            </template>
            <template v-else>
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-spinner animate-spin"/><span>Loading</span></p>
                <!-- prefetch -->
                <img class="hidden" :src="highImage">
            </template>
        </div>
    </div>
</template>
