<script setup lang="ts">
import { backendManager } from '@/Backend';
import { useBuilder } from '@/components/builder/BuilderComposable';
import builderSettings from '@/builder/graphics/Settings';
import { SetData } from '@/builder/SetData';
import { setsManager } from '@/builder/SetsManager';
import contractStore from '@/chain/Contracts';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import Window from '@/components/generic/Window.vue';
import { pushPopup } from '@/Notifications';
import { logDebug } from '@/Messages';
import { downloadJSON } from '@/url';
import { computed, ref, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import { useScreenshotHelpers } from '../ScreenshotComposable';
import { userSetStore } from '@/builder/UserSets';

const { chainBriqs, selectSet } = useBuilder();

defineEmits(['close']);

const props = defineProps<{
    setId: string,
    screenshot?: string,
    // Unchanged preview image.
    originalImage?: string,
}>();

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
        await store.commit('builderData/change_set_desc', { set: setData.value, desc });
    },
});

const downloadSet = () => {
    downloadJSON(setData.value.serialize(), setData.value.id + '.json');
}

// To check for real briqs, attempt to convert the set (do this separately for serialization reasons).
const exportSet = ref(undefined as undefined | SetData);
watch([setData, toRef(chainBriqs, 'byMaterial')], () => {
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
})

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
            throw new Error('The set could not be exported');

        if (exportSet.value.name.length > 200)
            throw new Error('Set name too long, max length is 200 characters.');

        let token_hint = setData.value.id;
        exportSet.value.id = contractStore.set.precomputeTokenId(maybeStore.value!.userWalletAddress, token_hint);

        let data = exportSet.value.serialize();

        data.recommendedSettings = builderSettings.getSettingsForSetExport();

        /*exportStep.value = 'SIGNING';

        const message = {
            domain: {
                name: 'briq',
                chainId: false ? 1 : 3,
                version: VERSION,
            },
            types: {
                StarkNetDomain: [
                    { name: 'name', type: 'felt' },
                    { name: 'chainId', type: 'felt' },
                    { name: 'version', type: 'felt' },
                ],
                Message: [{ name: 'message', type: 'felt' }],
            },
            primaryType: 'Message',
            message: {
                message: 'mint_set',
            },
        };

        let signature = await this.wallet.signer.signMessage(message);
        */
        exportStep.value = 'SENDING_TRANSACTION';

        const TX = await userSetStore.current!.mintSet(token_hint, data, await imageProcessing.value);

        exportStep.value = 'WAITING_FOR_CONFIRMATION';
        /*
        await new Promise((resolve) => {
            // Poll the transaction status regularly.
            let regularly: any;
            regularly = setInterval(async () => {
                await this.pending_transaction!.poll();
                if (this.pending_transaction!.isPending() || !this.pending_transaction!.isOk()) {
                    clearInterval(regularly);
                    resolve(null);
                }
            }, 3000);
        });
        */
        pushPopup('success', 'Set exported', `Set exported ${data.id} - TX ${TX.transaction_hash}`);
        logDebug('Set exported ' + data.id);

        setsManager.deleteLocalSet(setData.value.id);
        selectSet(exportSet.value);

        exportStep.value = 'DONE';
    } catch (err: any) {
        if (err?.message === 'User abort') {
            pushPopup('error', 'Mint error', 'Export aborted.');
            mintingError.value = 'Aborted by user';
        } else if (err === 'Timeout') {
            pushPopup('error', 'Mint error', 'Error while exporting set - wallet timeout.');
            mintingError.value = 'Wallet timeout';
        } else {
            pushPopup('error', 'Mint error', 'Error while exporting set\ncheck browser console for details');
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
    <template v-else-if="!exportStep">
        <Window size="w-[40rem]">
            <template #title>Export set</template>
            <div class="relative">
                <div class="absolute top-2 right-2 flex gap-2">
                    <Btn secondary @click="cropScreenshot"><i class="fa-solid fa-crop-simple"/></Btn>
                    <Btn secondary @click="retakeScreenshot"><i class="fa-solid fa-camera"/></Btn>
                </div>
                <img :src="previewImage">
            </div>
            <div class="my-2">
                <h3>Name</h3>
                <p><input type="text" v-model="setName" size="61"></p>
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
    <template v-else>
        <Window>
            <template #title>{{ mintingError ? 'Error while exporting' : 'Exporting set' }}</template>
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
                <p>Your set is under export.</p>
            </template>
        </Window>
    </template>
</template>