<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { setsManager } from '@/builder/SetsManager';
import { computed, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import { useSetHelpers } from '../SetComposable';
import { userSetStore } from '@/builder/UserSets';
import { router } from '@/Routes';
import ProgressBar from '@/components/generic/ProgressBar.vue';
import { useBooklet } from '../BookletComposable';
import { backendManager } from '@/Backend';

import ItemActivity from './ItemActivity.vue';

import briqIcon from '@/assets/landing/briq-icon.svg';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';
import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';
import { userBookletsStore } from '@/builder/UserBooklets';
import { SetData } from '@/builder/SetData';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { pushPopup } from '@/Notifications';
import DownloadSet from '../modals/DownloadSet.vue';

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

const mode = route.name === 'UserBooklet' ? 'BOOKLET' : 'CREATION';

const externalSetData = ref();

const booklet_id = computed(() => {
    if (mode === 'BOOKLET')
        return `${route.params.theme}/${route.params.booklet}`;
    if (externalSetData.value)
        return externalSetData.value.booklet;
    return userSetStore.current?.setData[route.params.set_id as string]?.booklet;
});

const bookletQuery = computed(() => booklet_id.value ? genesisStore.metadata[booklet_id.value] : undefined);
const bookletData = computed(() => bookletQuery.value?._data);

const setKind = computed(() => booklet_id.value ? 'OFFICIAL' : 'PERSONAL');

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

let bookletMetadata = undefined as undefined | ReturnType<typeof useBooklet>;
watch([booklet_id, set], () => {
    if (!bookletMetadata && booklet_id.value)
        bookletMetadata = useBooklet(mode === 'BOOKLET' ? set : undefined, booklet_id);
}, { immediate: true })


// Fallback case for sharing sets.
watchEffect(() => {
    if (userSetStore.state !== 'WALLET_LOADED')
        return;
    if (userSetStore.currentWallet) {
        if (userSetStore.current?.status === 'FETCHING')
            return;
        if (userSetStore.current?.sets.indexOf(route.params.set_id as string) !== -1)
            return;
    }
    if (externalSetData.value)
        return;
    // At this point, we assume the set is external and we must load its data explicitly.
    backendManager.fetch(`v1/metadata/${route.params.network}/${route.params.set_id as string}.json`).then(data => {
        // in case it runs several times.
        if (!externalSetData.value)
            externalSetData.value = {
                data: new SetData(route.params.set_id as string).deserialize(data),
                booklet: data.booklet_id,
                created_at: data.created_at * 1000, // JS timestamps are milliseconds
            }
    })
})

const attributes = computed(() => {
    if (mode === 'BOOKLET') {
        if (!bookletMetadata?.bookletData?.value)
            return [];
        const props = bookletMetadata?.bookletData?.value?.properties;
        return [
            { name: 'Serial Number', value: `#${bookletMetadata?.bookletData?.value.serial_number}` },
            { name: 'Theme', value: genesisStore.themedata[route.params.theme]._data?.name },
            { name: 'Artist', value: props.artist.value },
            { name: 'Year', value: new Date(props.date.value).getFullYear() },
            { name: '# of steps', value: props.nb_steps.value },
            { name: '# of briqs', value: bookletMetadata!.bookletData!.value.briqs.length },
        ]
    } else if (setKind.value === 'OFFICIAL') {
        const setmetadata = bookletMetadata?.bookletData?.value;
        if (!setmetadata)
            return [];
        const props = setmetadata.properties;
        return [
            { name: 'Serial Number', value: `#${setmetadata.serial_number}` },
            { name: 'Theme', value: genesisStore.themedata[setmetadata.booklet_id.split('/')[0]]._data?.name },
            { name: 'Artist', value: props.artist.value },
            { name: 'Year', value: new Date(props.date.value).getFullYear() },
            { name: '# of briqs', value: bookletMetadata!.bookletData!.value.briqs.length },
        ]
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

const copySetId = () => {
    navigator.clipboard.writeText(route.params.set_id);
    pushPopup('info', 'Set ID copied');
}

const modelViewerLoading = ref(true);
let modelViewerLoadingPromise: Promise<any>;

if (mode === 'CREATION') {
    modelViewerLoadingPromise = import('@google/model-viewer');
    modelViewerLoadingPromise.then(() => modelViewerLoading.value = false);
}

const previewURL = computed(() => backendManager.getPreviewUrl(set.value?.id, (route.params.network as string) || getCurrentNetwork()));

const view = ref((mode === 'BOOKLET' ? 'BOOKLET' : 'PREVIEW') as 'PREVIEW' | '3D' | 'BOOKLET');
</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status || (booklet_id ? 'FETCHING' : (set ? 'LOADED' : 'FETCHING'))"
        :attributes="attributes">
        <template #full-image="{ status }">
            <div class="relative h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                <template v-if="status === 'LOADED'">
                    <div class="flex justify-center items-center h-full w-full select-none">
                        <component
                            v-show="view === '3D'" v-if="mode === 'CREATION'"
                            :poster="previewURL"
                            class="w-full h-full"
                            :exposure="0.9"
                            :is="'model-viewer'" shadow-intensity="0.5" shadow-softness="1" disable-pan camera-controls auto-rotate="true"
                            :src="backendManager.getRoute(`model/${getCurrentNetwork()}/${set.id}.glb`)"/>
                        <div v-if="booklet_id" v-show="view === 'BOOKLET'" class="w-full h-full  p-4 xl:p-8 xl:pb-10 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(booklet_id!)}), url(${genesisStore.coverBookletRoute(booklet_id!, true)})` }"/>
                        <div v-if="mode === 'CREATION'" v-show="view === 'PREVIEW'" class="w-full h-full p-4 lg:p-16 xl:p-24 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${previewURL.replace('.png', '.jpg')})` }" :src="previewURL"/>
                        <div class="absolute top-4 left-4 flex flex-col gap-1" v-if="mode === 'CREATION'">
                            <Btn no-style :class="`${ view === 'PREVIEW' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='PREVIEW'"><img class="max-w-full max-h-full" :src="previewURL.replace('.png', '.jpg')"></Btn>
                            <Btn no-style :class="`${ view === '3D' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20 p-0 text-xl relative`" @click="view='3D'"><img class="absolute z-[-1] p-2 max-w-full max-h-full" :src="previewURL.replace('.png', '.jpg')"><div class="w-full h-full flex justify-center items-center backdrop-blur-[2px] rounded-md bg-grad-lightest bg-opacity-70"><i class="far fa-360-degrees"/></div></Btn>
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
        <template v-if="mode === 'CREATION'" #dropdown>
            <Btn no-background class="text-sm font-normal" @click="pushModal(DownloadSet, { setId: set?.id })">Download</Btn>
        </template>
        <template #default>
            <h1>{{ set?.name || bookletData?.name }}</h1>
            <template v-if="mode === 'BOOKLET'">
                <h5 class="mt-2">Booklet<span class="font-normal"> - {{ genesisStore.themedata[route.params.theme]._data?.name }}</span></h5>
                <p class="mt-6 mb-8 whitespace-pre-line">{{ bookletData?.description }}</p>
                <template v-if="!set">
                    <h2>Unstarted booklet</h2>
                    <p>Click on the button below to open the briq builder and create your official Genesis set.</p>
                </template>
                <template v-else-if="bookletMetadata?.shapeValidity.value !== 1">
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
                            <p class="text-lg font-semibold pt-1 flex justify-center items-center gap-3">
                                {{ Math.floor(bookletMetadata?.shapeValidity.value * 100) || 0 }}%<ProgressBar class="h-3" :percentage="bookletMetadata?.shapeValidity.value * 100 || 0"/>
                            </p>
                        </div>
                        <template v-if="!set">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="createSet()">Start building</Btn>
                        </template>
                        <template v-else-if="bookletMetadata?.shapeValidity.value !== 1">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="openSetInBuilder(set!.id)">Keep building</Btn>
                        </template>
                        <template v-else>
                            <Btn v-if="bookletMetadata?.shapeValidity?.value === 1" class="!h-auto text-md px-6 " secondary @click="pushModal(ExportSetVue, { setId: set!.id })">Mint</Btn>
                            <Btn class="!h-auto text-md px-6 w-max" @click="openSetInBuilder(set!.id)">Open builder</Btn>
                        </template>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p class="text-grad-dark">Currently owned: <span class="text-grad-darkest">{{ nbItems }}</span></p>
                    </div>
                </div>
                <h2>Want to list your booklet?</h2>
                <p>Seeling your booklet means you will no longer be able to mint the authenticated officiel set.</p>
                <div class="flex gap-2 my-4">
                    <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                    <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                </div>
                <div v-if="booklet_id">
                    <h2 class="mt-8">Item activity</h2>
                    <Suspense>
                        <ItemActivity type="booklet" :user="maybeStore?.user_id" :network="(route.params.network as string) || getCurrentNetwork()" :item="booklet_id"/>
                    </Suspense>
                </div>
            </template>
            <template v-else>
                <h5 class="mt-2">
                    {{ setKind === 'OFFICIAL' ? 'Official set' : 'Personal creation' }}<span class="font-normal"> - minted</span>
                </h5>
                <p class="mt-6">{{ set?.description }}</p>
                <p class="my-6 font-semibold cursor-pointer select-none w-fit" @click="copySetId">
                    ID: <span class="font-normal">{{ `${route.params.set_id.slice(0, 6)}...${route.params.set_id.slice(-4)}` }} <i class="far fa-copy"/></span>
                </p>
                <div class="rounded border border-grad-light overflow-hidden mb-10">
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                        <div>
                            <h5 class="font-normal text-grad-dark">briqs used</h5>
                            <p class="text-xl font-semibold pt-1">
                                <span class="w-6 h-6 inline-flex justify-center items-center bg-primary-lightest bg-opacity-50 rounded-[50%]"><briqIcon/></span> {{ set?.getNbBriqs?.() }}
                            </p>
                        </div>
                        <Btn v-if="isOwned" secondary @click="doDisassembly" class="h-full text-md px-6">Disassemble</Btn>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p><span class="font-medium">Created on: </span> {{ new Date(setData?.created_at).toLocaleString("en-uk", { dateStyle: "full", timeStyle: "short" }) }}</p>
                    </div>
                </div>
                <div>
                    <h4>See on</h4>
                    <p class="flex gap-3 mt-4 mb-10">
                        <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                        <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                    </p>
                </div>
                <div v-if="set?.id">
                    <h2>Item activity</h2>
                    <Suspense>
                        <ItemActivity type="set" :network="(route.params.network as string) || getCurrentNetwork()" :item="set.id"/>
                    </Suspense>
                </div>
            </template>
        </template>
    </GenericItemPage>
</template>
