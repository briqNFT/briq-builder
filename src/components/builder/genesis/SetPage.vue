<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { setsManager } from '@/builder/SetsManager';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import { useSetHelpers } from '../SetComposable';
import { userSetStore } from '@/builder/UserSets';
import { router } from '@/Routes';
import ProgressBar from '@/components/generic/ProgressBar.vue';
import { useBooklet } from '../BookletComposable';
import { backendManager } from '@/Backend';

import briqIcon from '@/assets/landing/briq-icon.svg';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';
import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';


const route = useRoute();
const genesisStore = useGenesisStore();

const { openSetInBuilder, disassembleSet } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();

const createSet = () => {
    if (!bookletData.value)
        return;
    openSetInBuilder(createBookletSet(bookletData.value?.name, booklet_id.value!));
}
const doDisassembly = async () => {
    if (await disassembleSet(set.value!.id))
        router.push({ name: 'Profile' });
}

const mode = route.name === 'UserBooklet' ? 'BOOKLET' : 'CREATION';

const booklet_id = computed(() => mode === 'BOOKLET' ? `${route.params.theme}/${route.params.booklet}` : userSetStore.current?.setData[route.params.set_id as string]?.booklet);

const set = computed(() => {
    if (mode === 'BOOKLET')
        return setsManager.getBookletSet(booklet_id.value);
    return userSetStore.current?.setData[route.params.set_id as string]?.data;
});

const bookletQuery = computed(() => booklet_id.value ? genesisStore.metadata[booklet_id.value] : undefined);
const bookletData = computed(() => bookletQuery.value?._data);

const setKind = computed(() => booklet_id.value ? 'OFFICIAL' : 'PERSONAL');

let bookletMetadata = undefined;
if (booklet_id.value)
    bookletMetadata = useBooklet(set, booklet_id);

const attribs = [
    {
        name: 'Pieces',
        value: set.value?.getNbBriqs() || bookletData.value?.briqs?.length || 0,
    },
]

</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status || (booklet_id ? 'FETCHING' : (set ? 'LOADED' : 'FETCHING'))"
        :attributes="attribs">
        <template #image>
            <img class="max-h-full" v-if="mode === 'BOOKLET'" :src="genesisStore.coverBookletRoute(booklet_id!)">
            <img class="max-h-full" v-else :src="backendManager.getPreviewUrl(set!.id)">
        </template>
        <template #default>
            <h1>{{ set?.name || bookletData?.name }}</h1>
            <template v-if="mode === 'BOOKLET'">
                <h5 class="mt-2">
                    <template v-if="mode === 'BOOKLET'">Booklet</template>
                </h5>
                <p class="mt-6 mb-8">{{ set?.description || bookletData?.description }}</p>
                <template v-if="!set">
                    <h2>Unstarted booklet</h2>
                    <p class="mb-4">Click on the button below to open the briq builder and create your official Genesis set.</p>
                    <Btn class="w-fit" @click="createSet()">Start building</Btn>
                </template>
                <template v-else>
                    <h2>Building progress</h2>
                    <p class="mb-4">
                        {{ Math.floor(bookletMetadata?.shapeValidity.value * 100) || 0 }}%
                        <ProgressBar class="h-4" :percentage="bookletMetadata?.shapeValidity.value * 100 || 0"/>
                    </p>
                    <template v-if="bookletMetadata?.shapeValidity.value < 100">
                        <p class="font-semibold mb-2">Unfinished</p>
                        <p>Your booklet set is unfinished. Make sure that it has all the pieces positioned at the right place to have it completed.</p>
                    </template>
                    <template v-else>
                        <p class="font-semibold mb-2">Congratulations!</p>
                        <p>Your set is now 100% completed. You can now mint the Official Genesis Set.</p>
                    </template>
                    <p class="flex gap-2">
                        <Btn class="w-fit mt-4" @click="openSetInBuilder(set!.id)">Open in builder</Btn>
                        <Btn class="mt-4" secondary @click="pushModal(ExportSetVue, { setId: set!.id })">Mint</Btn>
                    </p>
                </template>
                <h2 class="mt-10">Want to list your booklet?</h2>
                <p>Seeling your booklet means you will no longer be able to mint the authenticated officiel set.</p>
                <div class="flex gap-2 my-4">
                    <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                    <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                </div>
                <div>
                    <h2 class="mt-8">Item activity go bbrrr</h2>
                </div>
            </template>
            <template v-else>
                <h5 class="mt-2">
                    {{ setKind === 'OFFICIAL' ? 'Official set' : 'Personal creation' }}<span class="font-normal"> - minted</span>
                </h5>
                <div class="rounded border border-grad-light overflow-hidden mt-6 mb-10">
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                        <div>
                            <h5 class="font-normal text-grad-dark">briqs used</h5>
                            <p class="text-xl font-semibold pt-1">
                                <span class="w-6 h-6 inline-flex justify-center items-center bg-primary-lightest bg-opacity-50 rounded-[50%]"><briqIcon/></span> 560
                            </p>
                        </div>
                        <Btn secondary @click="doDisassembly" class="h-full text-md px-6">Disassemble</Btn>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p><span class="font-medium">Created on: </span> J'AI PAS LA DATE SAMÈRE</p>
                    </div>
                </div>
                <div>
                    <h4>See on</h4>
                    <p class="flex gap-3 mt-4 mb-10">
                        <a href="https://testnet.aspect.co/" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                        <a href="https://mintsquare.io/starknet" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                    </p>
                </div>
                <div>
                    <h2 class="mt-8">Item activity go bbrrr</h2>
                </div>
            </template>
        </template>
    </GenericItemPage>
</template>
