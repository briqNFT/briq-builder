<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { setsManager } from '@/builder/SetsManager';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import { useSetHelpers } from '../SetComposable';

const route = useRoute();
const mode = route.name === 'UserSet' ? 'OFFICIAL' : 'CREATION';

const booklet_id = computed(() => `${route.params.theme}/${route.params.booklet}`);

// Data can be either a booklet data or a set data, depending.

const genesisStore = useGenesisStore();

const bookletQuery = computed(() => mode === 'OFFICIAL' && genesisStore.metadata[booklet_id.value] || undefined);
const bookletData = computed(() => bookletQuery.value?._data);

const set = computed(() => setsManager.getBookletSet(booklet_id.value));

const { openSetInBuilder } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();
const createSet = () => {
    openSetInBuilder(createBookletSet(bookletData.value?.name, booklet_id));
}

const attribs = [
    {
        name: 'Pieces',
        value: bookletData.value?.briqs?.length || 0,
    },
]

</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status || 'FETCHING'"
        :description="bookletData?.description"
        :attributes="attribs">
        <template #default>
            <h1>{{ bookletData?.name }}</h1>
            <template v-if="!set">
                <h4>Booklet</h4>
                <h2>Unstarted booklet</h2>
                <p>Click on the button below to open the briq builder and mint your official set.</p>
                <Btn class="w-fit" @click="createSet()">Start building</Btn>
            </template>
            <template v-else>
                <h4>Official set</h4>
                <h2>Building progress</h2>
                <p class="rounded bg-info-warning">progress bar go brr</p>
                <p>Your official set is unfinished. Make sure that it has all the pieces positioned at the right place to have it completed.</p>
                <Btn class="w-fit" @click="openSetInBuilder(set!.id)">Open in builder</Btn>
            </template>
            <h2>Want to list your booklet?</h2>
            <div class="flex gap-2">
                <Btn secondary>See on Aspect</Btn>
                <Btn secondary>See on mintsquare</Btn>
            </div>
            <div>
                <h3>Item activity go bbrrr</h3>
            </div>
        </template>
    </GenericItemPage>
</template>
