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

const route = useRoute();
const mode = route.name === 'UserBooklet' ? 'BOOKLET' : 'CREATION';

const booklet_id = computed(() => mode === 'BOOKLET' ? `${route.params.theme}/${route.params.booklet}` : userSetStore.current?.setData[route.params.set_id as string]?.booklet);

const set = computed(() => {
    if (mode === 'BOOKLET')
        return setsManager.getBookletSet(booklet_id.value);
    return userSetStore.current?.setData[route.params.set_id as string].data;
});

const genesisStore = useGenesisStore();

const bookletQuery = computed(() => booklet_id.value ? genesisStore.metadata[booklet_id.value] : undefined);
const bookletData = computed(() => bookletQuery.value?._data);

const minted = computed(() => {
    return !!userSetStore.current?.setData[route.params.set_id as string];
})

const { openSetInBuilder, disassembleSet } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();
const createSet = () => {
    if (!bookletData.value)
        return;
    openSetInBuilder(createBookletSet(bookletData.value?.name, booklet_id.value!));
}

let bookletMetadata = undefined;
if (booklet_id.value)
    bookletMetadata = useBooklet(set, booklet_id);

const attribs = [
    {
        name: 'Pieces',
        value: set.value?.getNbBriqs() || bookletData.value?.briqs?.length || 0,
    },
]

const doDisassembly = async () => {
    if (await disassembleSet(set.value!.id))
        router.push({ name: 'Profile' });
}

</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status || (booklet_id ? 'FETCHING' : (set ? 'LOADED' : 'FETCHING'))"
        :attributes="attribs">
        <template #image>
            <img v-if="mode === 'BOOKLET'" :src="genesisStore.coverBookletRoute(booklet_id!)">
            <img v-else :src="backendManager.getPreviewUrl(set!.id)">
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
                        <ProgressBar class="border-grad-darker border h-4" :percentage="bookletMetadata?.shapeValidity.value * 100 || 0"/>
                    </p>
                    <p>Your booklet set is unfinished. Make sure that it has all the pieces positioned at the right place to have it completed.</p>
                    <Btn class="w-fit" @click="openSetInBuilder(set!.id)">Open in builder</Btn>
                </template>
                <h2 class="mt-8">Want to list your booklet?</h2>
                <p>Seeling your booklet means you will no longer be able to mint the authenticated officiel set.</p>
                <div class="flex gap-2 my-4">
                    <Btn secondary>See on Aspect</Btn>
                    <Btn secondary>See on mintsquare</Btn>
                </div>
                <div>
                    <h2 class="mt-8">Item activity go bbrrr</h2>
                </div>
            </template>
            <template v-else>
                <div v-if="!minted">
                    <h2>Want to sell your set?</h2>
                    <div class="flex gap-2"><Btn secondary>See on Aspect</Btn><Btn secondary>See on Mintsquare</Btn></div>
                </div>
                <div v-else-if="minted">
                    <h2>Want to disassemble your set?</h2>
                    <p>Once you do it you will get all the briqs back but the set will be destroyed. Note that there is no way back.  </p>
                    <Btn secondary @click="doDisassembly">Disassemble</Btn>
                </div>
            </template>
        </template>
    </GenericItemPage>
</template>
