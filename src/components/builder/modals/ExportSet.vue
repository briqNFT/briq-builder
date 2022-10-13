<script setup lang="ts">
import { useBuilder } from '@/components/builder/BuilderComposable';
import builderSettings from '@/builder/graphics/Settings';
import { SetData } from '@/builder/SetData';
import { setsManager } from '@/builder/SetsManager';
import contractStore from '@/chain/Contracts';
import { maybeStore } from '@/chain/WalletLoading';
import Window from '@/components/generic/Window.vue';
import { HashVue, Notification, pushPopup } from '@/Notifications';
import { downloadJSON } from '@/url';
import { computed, h, ref, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import { useScreenshotHelpers } from '../ScreenshotComposable';
import { userSetStore } from '@/builder/UserSets';
import { useBooklet } from '../BookletComposable';
import { router } from '@/Routes';
import { useGenesisStore } from '@/builder/GenesisStore';

const { chainBriqs } = useBuilder();

const emit = defineEmits(['close']);

const props = defineProps<{
    setId: string,
    screenshot?: string,
    // Unchanged preview image.
    originalImage?: string,
}>();


const {
    booklet,
    bookletData,
} = useBooklet();


const genesisStore = useGenesisStore();

// Reload the briqs on-chain in case there was an update.
chainBriqs.value?.loadFromChain();

const store = useStore();

const { previewImage, imageProcessing, takeScreenshot, updateImage, retakeScreenshot, cropScreenshot } = useScreenshotHelpers(props.screenshot, props.originalImage);

if (!previewImage.value)
    takeScreenshot().then(img => updateImage(img, true))

const setData = ref(setsManager.getInfo(props.setId).getSet()!);
watch(toRef(props, 'setId'), () => {
    setData.value = setsManager.getInfo(props.setId).getSet()!;
})

const setName = computed({
    get() {
        return setData.value.name;
    },
    async set(name: string) {
        await store.dispatch('builderData/change_set_name', { set: setData.value, name });
    },
});
const setDescription = computed({
    get() {
        return setData.value.description;
    },
    async set(desc: string) {
        store.commit('builderData/change_set_desc', { set: setData.value, desc });
    },
});

const downloadSet = () => {
    downloadJSON(setData.value.serialize(), setData.value.id + '.json');
}

// To check for real briqs, attempt to convert the set (do this separately for serialization reasons).
const exportSet = ref(undefined as undefined | SetData);
watch([setData, toRef(chainBriqs.value, 'byMaterial')], () => {
    let data = setData.value.serialize();
    let es = new SetData(data.id);
    es.deserialize(data);
    try {
        es.swapForRealBriqs(chainBriqs.value!);
    } catch (err) {
        exportSet.value = undefined;
        return;
    }
    exportSet.value = es;
}, {
    immediate: true,
    deep: true,
})

maybeStore.value?.ensureEnabled();

const hasSigner = computed(() => !!(maybeStore.value?.signer));
const hasLoadedBriqs = computed(() => chainBriqs.value?.status === 'OK');
// If there is no exportSet, then we have an error in swapping for real briqs.
const hasEnoughBriqs = computed(() => hasLoadedBriqs.value && exportSet.value);

// TODO: check if the set is being minted or is already minted (based on ID);
const alreadyMinted = false;
const validationError = computed(() => {
    if (!hasSigner.value)
        return {
            code: 'NO_SIGNER',
            title: 'Wallet not connected',
            message: 'You must connect a wallet before you can mint briqs',
        }
    if (!hasLoadedBriqs.value)
        return {
            code: 'BRIQS_NOT_LOADED',
            title: 'Briqs are not loaded yet',
            message: 'Please wait until briqs are loaded to mint this set.',
        }
    if (!hasEnoughBriqs.value)
        return {
            code: 'NOT_ENOUGH_BRIQS',
            title: 'Not enough briqs',
            message: 'You don’t have enough briqs to mint your set. Disassemble some of your other sets or buy new ones on the first (see our themes) or secondary markets (see on Aspect).',
        }
    return undefined;
})

const mintingError = ref('');
const exportStep = ref('' as '' | 'PREPARING' | 'SENDING_TRANSACTION' | 'WAITING_FOR_CONFIRMATION' | 'DONE');

const startMinting = async () => {
    exportStep.value = 'PREPARING';
    if (!contractStore.set)
        return;
    if (validationError.value)
        return;
    try {
        if (!exportSet.value)
            throw new Error('The set could not be minted');

        if (exportSet.value.name.length > 200)
            throw new Error('Set name too long, max length is 200 characters.');

        let token_hint = setData.value.id;
        exportSet.value.id = contractStore.set.precomputeTokenId(maybeStore.value!.userWalletAddress, token_hint);

        let data = exportSet.value.serialize();

        data.recommendedSettings = builderSettings.getSettingsForSetExport();

        exportStep.value = 'SENDING_TRANSACTION';

        let TX;
        if (booklet.value)
            TX = await userSetStore.current!.mintBookletSet(token_hint, data, booklet.value);
        else
            TX = await userSetStore.current!.mintSet(token_hint, data, await imageProcessing.value);

        exportStep.value = 'WAITING_FOR_CONFIRMATION';

        new Notification({
            type: 'minting_set',
            title: 'Minting set',
            level: 'info',
            timestamp: Date.now(),
            data: {
                tx_hash: TX.transaction_hash,
                name: data.name,
            },
            read: true,
        }).push(false);
        pushPopup('info', 'Minting set', h('div', [h('p', `Transaction to mint set '${data.name}' was successfully sent.`), HashVue(TX.transaction_hash)]));

        exportStep.value = 'DONE';
        setTimeout(() => {
            router.push({ name: 'Profile' })
            setsManager.deleteLocalSet(setData.value.id);
            emit('close');
        }, 0);
    } catch (err: any) {
        if (err?.message === 'User abort') {
            pushPopup('error', 'Mint error', 'Minting transaction aborted.');
            mintingError.value = 'Aborted by user';
        } else if (err === 'Timeout') {
            pushPopup('error', 'Mint error', 'Error while minting set - wallet timeout.');
            mintingError.value = 'Wallet timeout';
        } else {
            pushPopup('error', 'Mint error', 'Error while minting set\ncheck browser console for details');
            mintingError.value = err;
            console.error(err);
            //this.reportError(err);
        }
        mintingError.value = err;
    }
}

</script>

<template>
    <template v-if="validationError">
        <Window>
            <template #title>{{ validationError.title }}</template>
            <div>
                {{ validationError.message }}
            </div>
        </Window>
    </template>
    <template v-else-if="!exportStep && !booklet">
        <Window size="w-[40rem]">
            <template #title>Export set</template>
            <div class="relative flex justify-center items-center">
                <div class="absolute top-2 right-2 flex gap-2">
                    <Btn secondary @click="cropScreenshot"><i class="fa-solid fa-crop-simple"/></Btn>
                    <Btn secondary @click="retakeScreenshot"><i class="fa-solid fa-camera"/></Btn>
                </div>
                <img class="max-h-[30rem]" :src="previewImage">
            </div>
            <div class="my-2">
                <h3>Name</h3>
                <p><input type="text" v-model="setName" size="61" autocomplete="off" data-lpignore="true" data-form-type="other"></p>
            </div>
            <div class="my-2">
                <h3>Description</h3>
                <p>
                    <textarea v-model="setDescription" cols="60"/>
                </p>
            </div>
            <div class="flex justify-between gap-2">
                <Btn secondary @click="$emit('close')">Cancel</Btn>
                <div class="inline-flex grow justify-end"><Btn no-background class="self-end" @click="downloadSet">Save file locally</Btn></div>
                <Btn primary class="self-end" @click="startMinting">Mint</Btn>
            </div>
        </Window>
    </template>
    <template v-else-if="!exportStep && booklet">
        <Window size="w-[40rem]">
            <template #title>Mint an official set</template>
            <div class="relative flex justify-center items-center">
                <img class="max-h-[30rem]" :src="genesisStore.coverItemRoute(booklet)">
            </div>
            <div class="my-2">
                <h3>{{ bookletData!.name }}</h3>
            </div>
            <div class="my-2">
                <p>{{ bookletData!.description }}</p>
            </div>
            <div class="flex justify-between gap-2">
                <Btn secondary @click="$emit('close')">Cancel</Btn>
                <div class="inline-flex grow justify-end"><Btn no-background class="self-end" @click="downloadSet">Save file locally</Btn></div>
                <Btn primary class="self-end" @click="startMinting">Mint</Btn>
            </div>
        </Window>
    </template>
    <template v-else>
        <Window>
            <template #title>{{ mintingError ? 'Error while minting' : 'Minting set' }}</template>
            <div v-if="mintingError">
                <p>Unfortunately we encountered an error while minting the set.</p>
                <p>{{ mintingError }}</p>
                <div class="flex justify-between pt-4">
                    <Btn secondary @click="$emit('close')">Close</Btn>
                    <div>
                        <Btn no-background @click="exportStep = ''" class="mr-2">Go back</Btn>
                        <Btn @click="startMinting">Try again</Btn>
                    </div>
                </div>
            </div>
            <template v-else>
                <p>Your set is being minted.</p>
            </template>
        </Window>
    </template>
</template>