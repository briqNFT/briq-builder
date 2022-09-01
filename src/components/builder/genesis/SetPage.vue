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
import { TWO } from 'starknet/dist/constants';
import { Notification, notificationPopups } from '@/Notifications';
import ProgressBar from '@/components/generic/ProgressBar.vue';
import { useBooklet } from '../BookletComposable';

const route = useRoute();
const mode = route.name === 'UserSet' ? 'OFFICIAL' : 'CREATION';

const booklet_id = computed(() => `${route.params.theme}/${route.params.booklet}`);

// Data can be either a booklet data or a set data, depending.

const genesisStore = useGenesisStore();

const bookletQuery = computed(() => mode === 'OFFICIAL' && genesisStore.metadata[booklet_id.value] || undefined);
const bookletData = computed(() => bookletQuery.value?._data);

const minted = computed(() => {
    return !!userSetStore.current?.setData[route.params.set_id as string];
})

const set = computed(() => {
    if (mode === 'OFFICIAL')
        return setsManager.getBookletSet(booklet_id.value)
    return userSetStore.current?.setData[route.params.set_id as string];
});

const { openSetInBuilder } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();
const createSet = () => {
    openSetInBuilder(createBookletSet(bookletData.value?.name, booklet_id));
}

const {
    shapeValidity,
} = useBooklet(set, booklet_id);

const disassemble = async () => {
    const TX = await userSetStore.current!.disassemble(route.params.set_id as string);
    router.push({ name: 'Profile' });
    const notif = new Notification({
        type: 'set_delete_sent',
        title: 'Disassembling set',
        level: 'info',
        data: {
            tx_hash: TX.transaction_hash,
        },
        read: false,
    }).push();
    notif.read = true;
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
            <h1>{{ set?.name || bookletData?.name }}</h1>
            <template v-if="mode === 'OFFICIAL'">
                <template v-if="!set">
                    <h4>Booklet</h4>
                    <h2>Unstarted booklet</h2>
                    <p>Click on the button below to open the briq builder and mint your official set.</p>
                    <Btn class="w-fit" @click="createSet()">Start building</Btn>
                </template>
                <template v-else>
                    <h4>Official set</h4>
                    <h2>Building progress</h2>
                    <p>
                        {{ Math.floor(shapeValidity * 100) }}%
                        <ProgressBar class="border-grad-darker border h-4" :percentage="shapeValidity*100"/>
                    </p>
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
            <template v-else>
                <h4>Custom creation</h4>
                <div v-if="!minted">
                    <h2>Want to sell your set?</h2>
                    <div class="flex gap-2"><Btn secondary>See on Aspect</Btn><Btn secondary>See on Mintsquare</Btn></div>
                </div>
                <div v-else-if="minted">
                    <h2>Want to disassemble your set?</h2>
                    <p>Once you do it you will get all the briqs back but the set will be destroyed. Note that there is no way back.  </p>
                    <Btn secondary @click="disassemble">Disassemble</Btn>
                </div>
            </template>
        </template>
    </GenericItemPage>
</template>
