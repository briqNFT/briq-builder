<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { setsManager } from '@/builder/SetsManager';
import { computed, ComputedRef, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import { useSetHelpers } from '../SetComposable';
import { userSetStore } from '@/builder/UserSets';
import { router } from '@/Routes';
import ProgressBar from '@/components/generic/ProgressBar.vue';
import { useBooklet } from '../BookletComposable';
import { backendManager } from '@/Backend';
import { doDownload } from '@/url';

import ItemActivity from './ItemActivity.vue';

import briqIcon from '@/assets/landing/briq-icon.svg';

import UnframedLogo from '@/assets/marketplaces/logo-unframed-square.svg';
import ElementLogo from '@/assets/marketplaces/logo-element.svg';
import FlexLogo from '@/assets/marketplaces/logo-flex.png';
import PyramidLogo from '@/assets/marketplaces/logo-pyramid.png';

import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';
import { userBookletsStore } from '@/builder/UserBooklets';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { pushPopup } from '@/Notifications';
import DownloadSet from '../modals/DownloadSet.vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import * as starknet from 'starknet';
import { bookletDataStore } from '@/builder/BookletData';
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { externalSetCache } from '@/builder/ExternalSets';
import ShareOnTwitter from '../ShareOnTwitter.vue';
import { getSetLink, getBookletLink } from '@/chain/Marketplaces';

const route = useRoute();
const genesisStore = useGenesisStore();

const { openSetInBuilder, disassembleSet } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();

const createSet = () => {
    if (!bookletData.value)
        return;
    openSetInBuilder(createBookletSet(booklet_id.value!, bookletData.value!.name, bookletData.value!.description));
}

const doDisassembly = async () => {
    if (await disassembleSet(set.value!.id))
        router.push({ name: 'Profile' });
}

const chain_id = computed(() => (route.params.network as string) || getCurrentNetwork());

const mode = route.name === 'UserBooklet' ? 'BOOKLET' : 'CREATION';

const useExternalData = ref(false);
const externalSetDataFetchable = computed(() => useExternalData.value && externalSetCache[route.params.network as string][route.params.set_id as string]);
const externalSetData = computed(() => externalSetDataFetchable.value ? externalSetDataFetchable.value._data : undefined);

const booklet_id = computed(() => {
    if (mode === 'BOOKLET')
        return `${route.params.theme}/${route.params.booklet}`;
    if (externalSetData.value)
        return externalSetData.value.booklet_id;
    return userSetStore.current?.setData[route.params.set_id as string]?.booklet_id;
});

const collection_name = computed(() => {
    if (booklet_id.value)
        return genesisStore.themedata[booklet_id.value.split('/')[0]]._data?.name;
    if (externalSetData.value)
        return externalSetData.value.properties?.collections?.value[0];
    return undefined;
});

const setKind = computed(() => collection_name.value ? 'OFFICIAL' : 'PERSONAL');

const isOwned = computed(() => !!userSetStore.current?.setData[route.params.set_id as string]);

const setData = computed(() => {
    if (mode === 'BOOKLET')
        return undefined;
    if (externalSetData.value)
        return externalSetData.value;
    return userSetStore.current?.setData[route.params.set_id as string];
});


const set = computed(() => {
    if (mode === 'BOOKLET')
        return setsManager.getBookletSet(booklet_id.value);
    if (externalSetData.value)
        return externalSetData.value.data;
    return userSetStore.current?.setData[route.params.set_id as string]?.data;
});

let shapeValidity: ComputedRef<number> | undefined;
watch([booklet_id], () => {
    if (mode === 'BOOKLET')
        // Changing shapeValidity isn't reactive itself but we'll always update regardless,
        // because this means we've changed booklet_id.
        shapeValidity = useBooklet(booklet_id.value).shapeValidity;
}, { immediate: true })

const bookletQuery = computed(() => {
    if (!booklet_id.value)
        return undefined;
    return bookletDataStore[chain_id.value][booklet_id.value];
});

const bookletData = computed(() => {
    return bookletQuery.value?._data;
});

// Fallback case for sharing sets.
watchEffect(() => {
    if (mode !== 'CREATION')
        return;
    if (userSetStore.state !== 'WALLET_LOADED')
        return;
    if (userSetStore.currentWallet) {
        if (userSetStore.current?.status === 'FETCHING')
            return;
        if (userSetStore.current?.sets.indexOf(route.params.set_id as string) !== -1) {
            useExternalData.value = false;
            return;
        }
    }
    if (useExternalData.value)
        return;
    // At this point, we assume the set is external and we must load its data explicitly.
    useExternalData.value = true;
})

const description = computed(() => {
    if (mode === 'CREATION' && set.value?.description)
        return set.value.description.split('\n\n');
    if (mode === 'BOOKLET' && bookletData.value?.description)
        return bookletData.value.description.split('\n\n');
    return [];
});


const attributes = computed(() => {
    if (mode === 'BOOKLET') {
        if (!bookletData?.value)
            return [];
        const props = bookletData.value?.properties;
        return [
            { name: 'Serial Number', value: `#${bookletData.value.serial_number}` },
            { name: 'Theme', value: genesisStore.themedata[route.params.theme]._data?.name },
            { name: 'Artist', value: props.artist.value },
            { name: 'Year', value: new Date(props.date.value).getFullYear() },
            { name: '# of steps', value: props.nb_steps.value },
            { name: '# of briqs', value: bookletData!.value.briqs.length },
        ]
    } else if (setKind.value === 'OFFICIAL') {
        const setmetadata = bookletData.value || externalSetData.value!;
        if (!setmetadata)
            return [];
        const props = setmetadata.properties;
        if (!props)
            return [];
        const ret = [
            { name: 'Year', value: props.date ? new Date(props.date.value).getFullYear() : new Date(externalSetData.value!.created_at).getFullYear() },
            { name: '# of briqs', value: set.value?.getNbBriqs() },
        ] as { name: string, value: string | number }[];
        if (props.artist)
            ret.push({ name: 'Artist', value: props.artist.value });
        if ('serial_number' in setmetadata)
            ret.push({ name: 'Serial Number', value: `#${setmetadata.serial_number}` });
        if (collection_name.value)
            ret.push({ name: 'Collection', value: collection_name.value });
        return ret;
    } else
        return [
            { name: 'Year', value: new Date(userSetStore.current?.setData?.[route.params.set_id as string]?.created_at ?? Date.now()).getFullYear() },
            { name: '# of briqs', value: set.value?.getNbBriqs() },
        ]
});

const nbItems = computed(() => {
    if (mode === 'BOOKLET')
        return userBookletsStore.current?.booklets?.filter(x => x === booklet_id.value).length ?? '...';
    return 1;
});

const hasPendingActivity = computed(() => {
    if (mode === 'BOOKLET')
        return (userBookletsStore.current?.metadata?.[booklet_id.value]?.updates.length ?? 0) > 0;
    return userSetStore.current?.metadata[route.params.set_id as string]?.status === 'TENTATIVE';
});


const copySetId = () => {
    navigator.clipboard.writeText(route.params.set_id);
    pushPopup('info', 'Set ID copied');
}

const downloadPng = () => {
    doDownload(previewURL.value, 'briq.png');
}

const shareUrl = computed(() => `https://${window.location.hostname}${route.path}`);

const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl.value);
};

const modelViewerLoading = ref(true);
let modelViewerLoadingPromise: Promise<any>;

if (mode === 'CREATION') {
    modelViewerLoadingPromise = import('@google/model-viewer');
    modelViewerLoadingPromise.then(() => modelViewerLoading.value = false);
}

const previewURL = computed(() => backendManager.getPreviewUrl(set.value?.id, chain_id.value));

const token_decimal = computed(() => {
    if (route.params.set_id)
        return starknet.number.toBN(route.params.set_id as string).toString();
    return bookletData.value?.token_id || '0';
})

const view = ref((mode === 'BOOKLET' ? 'BOOKLET' : 'PREVIEW') as 'PREVIEW' | '3D' | 'BOOKLET');
</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status ?? (set ? 'LOADED' : 'FETCHING')"
        :attributes="attributes">
        <template #full-image="{ status }">
            <div class="relative h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                <Tooltip
                    v-if="hasPendingActivity"
                    tooltip="Some items of this type have pending transactions. Transaction failure could lead to UI changes.">
                    <div class="absolute top-4 select-none right-4 z-10 rounded bg-info-info bg-opacity-10 text-sm text-info-info px-2 py-1">
                        Pending activity
                    </div>
                </Tooltip>
                <template v-if="status === 'LOADED'">
                    <div class="flex justify-center items-center h-full w-full select-none">
                        <component
                            v-show="view === '3D'" v-if="mode === 'CREATION'"
                            :poster="previewURL"
                            class="w-full h-full"
                            :exposure="0.9"
                            :is="'model-viewer'" shadow-intensity="0.5" shadow-softness="1" disable-pan camera-controls auto-rotate="true"
                            :src="backendManager.getRoute(`model/${chain_id}/${set.id}.glb`)"/>
                        <div v-if="booklet_id" v-show="view === 'BOOKLET'" class="w-full h-full  p-4 xl:p-8 xl:pb-10 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(booklet_id!)}), url(${genesisStore.coverBookletRoute(booklet_id!, true)})` }"/>
                        <div
                            v-if="mode === 'CREATION'" v-show="view === 'PREVIEW'" class="w-full h-full p-4 lg:p-12 xl:p-16 bg-contain bg-origin-content bg-center bg-no-repeat"
                            :style="{ backgroundImage: `url(${previewURL})`, backgroundColor: setData?.background_color ? `#${setData.background_color}` : undefined }"
                            :src="previewURL"/>
                        <!-- Buttons to switch views -->
                        <div class="absolute top-4 left-4 flex flex-col gap-4" v-if="mode === 'CREATION'">
                            <Btn no-style :class="`${ view === 'PREVIEW' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='PREVIEW'"><img class="max-w-full max-h-full" :src="previewURL"></Btn>
                            <Btn no-style :class="`${ view === '3D' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20 p-0 text-xl relative`" @click="view='3D'"><img class="absolute z-[-1] p-2 max-w-full max-h-full" :src="previewURL"><div class="w-full h-full flex justify-center items-center backdrop-blur-[2px] rounded-md bg-grad-lightest bg-opacity-70"><i class="far fa-360-degrees"/></div></Btn>
                            <Btn no-style :class="`${ view === 'BOOKLET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" v-if="bookletData" @click="view='BOOKLET'"><img :src="genesisStore.coverBookletRoute(booklet_id!, true)"></Btn>
                        </div>
                    </div>
                </template>
                <template v-else-if="status === 'FETCHING'">
                    <p>Loading image</p>
                </template>
                <div v-else><p>Error while loading data</p></div>
            </div>
        </template>
        <template #quick_actions>
            <MenuDropdown v-if="mode === 'CREATION'" icon no-background no-marker :must-click="true" class="!h-8 px-2 font-normal text-sm">
                <template #button>
                    <i class="fa-regular fa-share-nodes text-lg"/> <span class="font-medium">Share</span>
                </template>
                <Btn no-background ico class="text-sm justify-start font-normal" @click="copyShareLink"><i class="far fa-copy mr-2"/> Copy link</Btn>
                <ShareOnTwitter no-background :owned="!externalSetData"/>
            </MenuDropdown>
            <MenuDropdown v-if="mode === 'CREATION'" icon no-background no-marker :must-click="true" class="!h-8 px-2 font-normal text-sm">
                <template #button>
                    <i class="far fa-cloud-arrow-down text-lg"/> <span class="font-medium">Download</span>
                </template>
                <Btn no-background class="text-sm justify-start font-normal" @click="downloadPng">Download image</Btn>
                <Btn no-background class="text-sm justify-start font-normal" @click="pushModal(DownloadSet, { setId: set?.id })">Download set data</Btn>
            </MenuDropdown>
        </template>
        <template #default>
            <h1>{{ set?.name || bookletData?.name }}</h1>
            <template v-if="mode === 'BOOKLET'">
                <h5 class="mt-1">Booklet<span class="font-normal"> - {{ genesisStore.themedata[route.params.theme]._data?.name }}</span></h5>
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
                <template v-if="!set">
                    <h2>Unstarted booklet</h2>
                    <p>Click on the button below to open the briq builder and create your official Genesis set.</p>
                </template>
                <template v-else-if="shapeValidity !== 1">
                    <h2>Work in progress</h2>
                    <p>Your booklet set is unfinished. Make sure that it has all the pieces positioned at the right place to be able to mint it.</p>
                </template>
                <template v-else>
                    <h2>Ready to mint</h2>
                    <p>Your set is now 100% completed. You can now mint the Official Genesis Set.</p>
                </template>
                <div class="rounded border border-grad-light overflow-hidden mt-4 mb-10">
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest gap-4">
                        <div class="flex-1">
                            <h5 class="font-normal text-grad-dark">Progress</h5>
                            <p class="text-xl font-semibold pt-1 flex justify-center items-center gap-3">
                                {{ Math.floor(shapeValidity * 100) || 0 }}%<ProgressBar class="h-3" :percentage="shapeValidity * 100 || 0"/>
                            </p>
                        </div>
                        <template v-if="!set">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="createSet()">Start building</Btn>
                        </template>
                        <template v-else-if="shapeValidity !== 1">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="openSetInBuilder(set!.id)">Keep building</Btn>
                        </template>
                        <template v-else>
                            <Btn v-if="shapeValidity === 1" class="!h-auto text-md px-6 " secondary @click="pushModal(ExportSetVue, { setId: set!.id })">Mint</Btn>
                            <Btn class="!h-auto text-md px-6 w-max" @click="openSetInBuilder(set!.id)">Open builder</Btn>
                        </template>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p class="text-grad-dark">Currently owned: <span class="text-grad-darkest">{{ nbItems }}</span></p>
                    </div>
                </div>
                <h2>Want to list your booklet?</h2>
                <p>Seeling your booklet means you will no longer be able to mint the authenticated officiel set.</p>
                <div class="flex gap-2 mt-4 mb-10">
                    <a :href="getBookletLink('unframed', chain_id, bookletData?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><UnframedLogo class="w-5 mr-3"/> Unframed</Btn></a>
                    <a :href="getBookletLink('element', chain_id, bookletData?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><ElementLogo class="w-5 mr-3"/> Element</Btn></a>
                    <a :href="getBookletLink('flex', chain_id, bookletData?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><img :src="FlexLogo" class="w-7 mr-3"> Flex</Btn></a>
                    <a :href="getBookletLink('pyramid', chain_id, bookletData?.token_id || '0')" rel="noopener" target="_blank"><Btn secondary><img :src="PyramidLogo" class="w-8 mr-3"> Pyramid</Btn></a>
                </div>
                <div v-if="booklet_id">
                    <Suspense>
                        <ItemActivity type="booklet" :user="maybeStore?.user_id" :network="chain_id" :item="booklet_id"/>
                    </Suspense>
                </div>
            </template>
            <template v-else>
                <h5 class="mt-1">
                    {{ setKind === 'OFFICIAL' ? 'Official set' : 'Personal creation' }}<span class="font-normal"> - minted</span>
                </h5>
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
                <p class="my-6 font-semibold cursor-pointer select-none w-fit" @click="copySetId">
                    ID: <span class="font-normal">{{ `${route.params.set_id.slice(0, 6)}...${route.params.set_id.slice(-4)}` }} <i class="far fa-copy"/></span>
                </p>
                <div class="rounded border border-grad-light overflow-hidden mb-10">
                    <!-- latter part just for VSCode to understand things -->
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                        <div>
                            <h5 class="font-normal text-grad-dark">briqs used</h5>
                            <p class="text-xl font-semibold pt-1">
                                <span class="w-6 h-6 inline-flex justify-center items-center bg-primary-lightest bg-opacity-50 rounded-[50%]"><briqIcon :width="12"/></span> {{ set?.getNbBriqs?.() }}
                            </p>
                        </div>
                        <div class="flex justify-between items-stretch gap-2">
                            <RouterLink v-if="set?.id" :to="`/briqmas_next_day?token=${set.id}`"><Btn v-if="isOwned && booklet_id === 'briqmas/briqmas_tree'" class="!h-full text-md px-6 py-0">View in<br>living room</Btn></RouterLink>
                            <Btn v-if="isOwned" :disabled="false && hasPendingActivity" secondary @click="doDisassembly" class="!h-auto text-md px-6">Disassemble</Btn>
                        </div>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p><span class="font-medium">Created on: </span> {{ new Date(setData?.created_at).toLocaleString("en-uk", { dateStyle: "full", timeStyle: "short" }) }}</p>
                    </div>
                </div>
                <div>
                    <h4>See on</h4>
                    <p class="flex gap-3 mt-4 mb-10">
                        <a :href="getSetLink('unframed', chain_id, route.params.set_id)" rel="noopener" target="_blank"><Btn secondary><UnframedLogo class="w-5 mr-3"/> Unframed</Btn></a>
                        <a :href="getSetLink('element', chain_id, route.params.set_id)" rel="noopener" target="_blank"><Btn secondary><ElementLogo class="w-5 mr-3"/> Element</Btn></a>
                        <a :href="getSetLink('flex', chain_id, route.params.set_id)" rel="noopener" target="_blank"><Btn secondary><img :src="FlexLogo" class="w-7 mr-3"> Flex</Btn></a>
                        <a :href="getSetLink('pyramid', chain_id, route.params.set_id)" rel="noopener" target="_blank"><Btn secondary><img :src="PyramidLogo" class="w-8 mr-3"> Pyramid</Btn></a>
                    </p>
                </div>
                <div v-if="set?.id">
                    <Suspense>
                        <ItemActivity type="set" :network="chain_id" :item="set.id"/>
                    </Suspense>
                </div>
            </template>
        </template>
    </GenericItemPage>
</template>
