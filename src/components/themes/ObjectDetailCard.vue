<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useGenesisStore } from '@/builder/GenesisStore';
import { themeSetsDataStore, themeSetsOwnerStore } from '@/builder/DucksSale';
import { Fetchable } from '@/DataFetching';
import { addressToStarknetId } from '@/chain/StarknetId';
import { CHAIN_NETWORKS } from '@/chain/Network';
import { getBookletLink, getSetLink } from '@/chain/Marketplaces';
import { bookletDataStore } from '@/builder/BookletData';

const props = defineProps<{
    network: CHAIN_NETWORKS,
    theme: string,
    tokenId: string,
    expand?: boolean,
}>();

const genesisStore = useGenesisStore();

const highImage = computed(() => genesisStore.coverItemRoute(props.tokenId, false));
const lowImage = computed(() => genesisStore.coverItemRoute(props.tokenId, true));

const data = ref(new Fetchable<Record<string, any>>());
watchEffect(() => {
    props.tokenId;
    data.value.fetch(async () => {
        const data = (await themeSetsDataStore[props.network][props.theme]._fetch)?.[props.tokenId];
        if (!data)
            return await bookletDataStore[props.network][props.tokenId]._fetch;
        return data;
    });
})

const isAssembled = computed(() => !!themeSetsDataStore[props.network][props.theme]._data?.[props.tokenId]);

const ownerData = computed(() => {
    if (themeSetsOwnerStore[props.network][props.theme]._data) {
        const ret = new Fetchable<string>();
        ret._data = themeSetsOwnerStore[props.network][props.theme]._data?.[data.value._data.id];
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
                    :class="`rounded-md overflow-hidden min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-max bg-contain bg-origin-content bg-center bg-no-repeat`"
                    :style="{ backgroundImage: `url(${highImage}), url(${lowImage})` }">
                    <img class="min-h-0 min-w-0 max-h-[8rem] tall-sm:max-h-full max-w-full invisible" :src="lowImage">
                </p>
                <h3 class="font-semibold text-md tall-sm:text-lg px-4 overflow-x-auto">{{ data._data!.name }} </h3>
                <p class="px-4 flex justify-between text-sm tall-sm:text-md py-[1px]">{{ data._data!.description }}</p>
                <hr class="my-2">

                <div class="px-4 py-2 pt-0 flex flex-col gap-2">
                    <p v-if="isAssembled && theme !== 'ducks_frens'" class="flex justify-between">
                        <span class="text-grad-dark">Owner</span>
                        <span class="font-medium">{{ currentOwner }}</span>
                    </p>
                    <p v-else-if="!isAssembled" class="flex justify-center">
                        <span class="text-grad-dark">This set is currently disassembled!</span>
                    </p>
                    <p v-if="expand && isAssembled" class="flex justify-between flex-wrap gap-2">
                        <RouterLink :to="{ name: 'UserCreation', params: { network: network, set_id: data._data!.id } }">
                            <Btn secondary>See details</Btn>
                        </RouterLink>
                        <a :href="getSetLink('element', network, theme, data._data!.id)" target="_blank">
                            <Btn secondary>See on Element</Btn>
                        </a>
                    </p>
                    <p v-else-if="expand && !isAssembled" class="flex justify-between flex-wrap gap-2">
                        <a :href="getBookletLink('element', network, theme, data._data!.token_id)" target="_blank">
                            <Btn secondary>See on Element</Btn>
                        </a>
                        <a :href="getBookletLink('unframed', network, theme, data._data!.token_id)" target="_blank">
                            <Btn secondary>See on Unframed</Btn>
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
