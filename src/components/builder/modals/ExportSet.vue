<script setup lang="ts">
import { useBuilder } from '@/components/builder/BuilderComposable';
import builderSettings from '@/builder/graphics/Settings';
import { SetData } from '@/builder/SetData';
import { setsManager } from '@/builder/SetsManager';
import contractStore from '@/chain/Contracts';
import { maybeStore } from '@/chain/WalletLoading';
import Window from '@/components/generic/Window.vue';
import { Notification, pushPopup } from '@/Notifications';
import { downloadJSON } from '@/url';
import { computed, nextTick, ref, toRef, watch } from 'vue';
import { useScreenshotHelpers } from '../ScreenshotComposable';
import { userSetStore } from '@/builder/UserSets';
import { bookletStore } from '../BookletComposable';
import { router } from '@/Routes';
import { useGenesisStore } from '@/builder/GenesisStore';
import { useThemeURLs } from '../genesis/ThemeUrlComposable';
import { APP_ENV } from '@/Meta';
import { getCurrentNetwork } from '@/chain/Network';
import { getSetObject } from '@/builder/graphics/SetRendering';
import { userBookletsStore } from '@/builder/UserBooklets';
import { bookletDataStore } from '@/builder/BookletData';
import { hexUuid } from '@/Uuid';
import BuyBriqsWidget from '@/components/BuyBriqsWidget.vue';
import { Call } from 'starknet';
import { ExplorerTxUrl } from '@/chain/Explorer';

const { chainBriqs } = useBuilder();

const emit = defineEmits(['close']);

const props = defineProps<{
    setId: string,
    screenshot?: string,
    // Unchanged preview image.
    originalImage?: string,
}>();

const genesisStore = useGenesisStore();

const setData = ref(setsManager.getInfo(props.setId).getSet()!);
watch(toRef(props, 'setId'), () => {
    setData.value = setsManager.getInfo(props.setId).getSet()!;
})

const booklet = computed(() => setsManager.getInfo(props.setId).booklet);
const bookletData = computed(() => booklet.value && bookletDataStore[getCurrentNetwork()][booklet.value]._data);

// Reload the briqs on-chain in case there was an update.
chainBriqs.value?.loadFromChain();

const { previewImage, imageProcessing, takeScreenshot, updateImage, forceImage, retakeScreenshot, cropScreenshot } = useScreenshotHelpers(props.screenshot, props.originalImage);

if (!previewImage.value) {
    let object = getSetObject();
    if (booklet.value && booklet.value.includes('ducks_everywhere')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = genesisStore.coverItemRoute(booklet.value) + '?no-cache-please-2';
        forceImage(img);
    } else {
        if (booklet.value) {
            const rot = bookletStore.shapeValidityOffset[booklet.value][0];
            object = object.clone();
            if (rot === 1)
                object.rotateY(-Math.PI/2);
            else if (rot === 2)
                object.rotateY(-Math.PI);
            else if (rot === 3)
                object.rotateY(-3 * Math.PI/2);
        }
        takeScreenshot(object, !!booklet.value).then(img => updateImage(img, true))
    }
}

const downloadSet = () => {
    downloadJSON(setData.value.serialize(), setData.value.id + '.json');
}

const isUnboxed = computed(() => {
    if (!booklet.value)
        return true;
    const nbOwned = userBookletsStore.current?.booklets?.filter(x => x === booklet.value).length || 0;
    if (nbOwned === 0)
        return false;
    const metaActivity = userBookletsStore.current?.metadata[booklet.value];
    if (!metaActivity || metaActivity.updates.length < nbOwned)
        return true;
    // At this point we'll have to check if any update is pending.
    // (we can ignore DELETING_SOON because those are removed from available boxes anyways)
    return metaActivity.updates.some(x => x.status === 'TENTATIVE_PENDING');
})


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
const hasLoadedBriqs = computed(() => chainBriqs.value?.status !== 'NOT_LOADED');
// If there is no exportSet, then we have an error in swapping for real briqs.
const hasEnoughBriqs = computed(() => hasLoadedBriqs.value && exportSet.value);

const validationError = computed(() => {
    if (exportStep.value === 'DONE')
        return undefined;
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
    return undefined;
})

const mintingError = ref('');
const exportStep = ref('' as '' | 'PREPARING' | 'BUY_BRIQS' | 'SENDING_TRANSACTION' | 'WAITING_FOR_CONFIRMATION' | 'DONE');
const TX = ref();

const briqTransaction = ref(undefined as undefined | Array<Call>);
const briqPendingObject = ref(undefined as undefined | unknown);

const buyBriqsAndMint = async (data: unknown) => {
    briqTransaction.value = contractStore.briq_factory?.buyTransaction(contractStore.eth_bridge_contract!, data.briqs, data.price);
    // Don't notify in case we stop.
    briqPendingObject.value = chainBriqs.value?.show('0x1', data.briqs, '');
    // This will update ExportSet through watchers, but might take some time, so nextTick.
    nextTick(() => {
        startMinting();
    });
}

const briqsNeeded = computed(() => {
    // TODO -> this only works so far as we have one type of briq.
    return setData.value.getNbBriqs() - chainBriqs.value?.getNbBriqs() || 0;
})

const startMinting = async () => {
    exportStep.value = 'PREPARING';
    if (!contractStore.set)
        return;
    if (validationError.value)
        return;

    if (!hasEnoughBriqs.value) {
        exportStep.value = 'BUY_BRIQS';
        return;
    }
    try {
        if (!exportSet.value)
            throw new Error('The set could not be minted');

        if (exportSet.value.name.length > 200)
            throw new Error('Set name too long, max length is 200 characters.');

        let token_hint = hexUuid();
        exportSet.value.id = contractStore.set.precomputeTokenId(maybeStore.value!.userWalletAddress, token_hint);

        let data = exportSet.value.serialize();

        // We need to adjust the position of briqs so that we mint the right stuff.
        if (booklet.value) {
            const rotatePos = (vec: any, index = 0) => {
                if (index === 0)
                    return vec;
                if (index === 1)
                    return [-vec[2], vec[1], vec[0]];
                if (index === 2)
                    return [-vec[0], vec[1], -vec[2]];
                if (index === 3)
                    return [vec[2], vec[1], -vec[0]];
            }

            for (const briq of data.briqs) {
                briq.pos = rotatePos(briq.pos, bookletStore.shapeValidityOffset[booklet.value][0]);
                briq.pos[0] += bookletStore.shapeValidityOffset[booklet.value][1];
                briq.pos[2] += bookletStore.shapeValidityOffset[booklet.value][2];
            }
        }

        data.recommendedSettings = builderSettings.getSettingsForSetExport();

        exportStep.value = 'SENDING_TRANSACTION';

        if (booklet.value) {
            TX.value = await userSetStore.current!.mintBookletSet(briqTransaction.value || [], token_hint, data, (await imageProcessing.value)!, booklet.value);
            window.sessionStorage.removeItem(`booklet_${booklet.value}`);
        } else
            TX.value = await userSetStore.current!.mintSet(briqTransaction.value || [], token_hint, data, await imageProcessing.value);

        if (briqPendingObject.value) {
            // Remove and re-add to get the notifications.
            const briqsBought = briqPendingObject.value.quantity;
            chainBriqs.value!.removeMetadataItem(briqPendingObject.value);
            briqPendingObject.value = chainBriqs.value!.show('0x1', briqsBought, TX.value.transaction_hash, true);
        }

        exportStep.value = 'WAITING_FOR_CONFIRMATION';

        new Notification({
            type: 'minting_set',
            title: 'Minting set',
            level: 'info',
            timestamp: Date.now(),
            data: {
                tx_hash: TX.value.transaction_hash,
                name: data.name,
                set_id: data.id,
                network: getCurrentNetwork(),
            },
            read: true,
        }).push(false);

        exportStep.value = 'DONE';
        setTimeout(() => {
            router.push({ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: data.id } })
            setsManager.hideLocalSet(setData.value.id, data.id);
        }, 0);
    } catch (err: any) {
        // Reset the briqs if we bought some.
        // TODO: this is fairly hacky.
        if (briqPendingObject.value)
            chainBriqs.value!.removeMetadataItem(briqPendingObject.value);

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

const { themeSplashSrcSet } = useThemeURLs();

</script>

<style scoped>
button:not(.btn):not(.nostyle)::before {
    @apply rounded;
}</style>

<template>
    <template v-if="validationError">
        <Window>
            <template #title>{{ validationError.title }}</template>
            <div v-if="validationError.code !== 'NOT_ENOUGH_BRIQS' || APP_ENV !== 'dev'" class="whitespace-pre-line">
                {{ validationError.message }}
            </div>
            <div v-else class="leading-snug">
                <p class="mb-1">Briq has launched on StarkNet mainnet.</p>
                <p class="mb-1">Check out our initial sale to get some briqs!</p>
                <RouterLink :to="{ name: 'Theme', params: { theme: 'starknet_planet' } }" @click="emit('close')">
                    <div class="flex flex-col items-center justify-center relative my-4">
                        <img class="rounded-md h-[10rem] w-auto" :srcset="themeSplashSrcSet('starknet_planet', 'high', 'starknet-mainnet')" :alt="`Theme splash for Starknet Planet`">
                    </div>
                </RouterLink>
            </div>
        </Window>
    </template>
    <template v-else-if="!exportStep && !booklet">
        <Window size="w-[38rem]">
            <template #title>Mint set</template>
            <div class="relative flex justify-center items-center">
                <div class="absolute top-2 right-2 flex gap-2">
                    <Btn secondary @click="cropScreenshot"><i class="far fa-crop-simple"/></Btn>
                    <Btn secondary @click="retakeScreenshot"><i class="far fa-camera"/></Btn>
                </div>
                <img v-show="previewImage" class="max-h-[24rem] bg-background rounded-md" :src="previewImage">
                <div v-if="!previewImage" class="h-[12rem] bg-background rounded-md flex items-center justify-center text-sm"><p class="p-4">...Taking HD Screenshot...</p></div>
            </div>
            <div class="my-4">
                <p class="mb-2">Name</p>
                <p><input class="max-w-full" type="text" v-model="setData.name" size="61" autocomplete="off" data-lpignore="true" data-form-type="other"></p>
            </div>
            <div class="my-4">
                <p class="mb-2">Description</p>
                <p>
                    <textarea class="max-w-full" v-model="setData.description" cols="60"/>
                </p>
            </div>
            <div class="flex justify-between gap-2 mt-6">
                <Btn secondary class="!font-normal" @click="$emit('close')">Cancel</Btn>
                <div class="inline-flex grow justify-end"><Btn no-background class="!font-normal self-end" @click="downloadSet">Save file locally</Btn></div>
                <Btn primary class="self-end" @click="startMinting">Mint</Btn>
            </div>
        </Window>
    </template>
    <template v-else-if="!exportStep && booklet">
        <Window size="w-[40rem]">
            <template #title>Mint an official set</template>
            <p class="mb-4">Minting an official set will wrap the corresponding booklet inside the set.</p>
            <div class="relative flex justify-center items-center bg-background rounded-md p-4">
                <img v-show="previewImage" class="max-h-[24rem] bg-background rounded-md" :src="previewImage">
                <div v-if="!previewImage" class="h-[12rem] bg-background rounded-md flex items-center justify-center text-sm"><p class="p-4">...Taking HD Screenshot...</p></div>
            </div>
            <div class="mt-3 mb-2">
                <h3>{{ bookletData!.name }}</h3>
            </div>
            <div class="my-2 text-sm whitespace-pre-line">
                <p>{{ bookletData!.description }}</p>
            </div>
            <div class="flex justify-between gap-2 mt-6">
                <Btn secondary class="!font-normal" @click="$emit('close')">Cancel</Btn>
                <div class="inline-flex grow justify-end"><Btn no-background class="!font-normal self-end" @click="downloadSet">Save file locally</Btn></div>
                <Btn v-if="isUnboxed" primary class="self-end" @click="startMinting">Mint</Btn>
                <Btn
                    v-else :disabled="true" tooltip="Unbox confirmation is still being processed on StarkNet. Please wait a little bit more!"
                    no-style class="h-auto text-sm pl-4 pr-6 py-3 bg-info-info rounded bg-opacity-10 text-info-info">
                    <i class="text-lg far fa-loader animate-spin mr-3"/> Pending unboxing
                </Btn>
            </div>
        </Window>
    </template>
    <template v-else-if="exportStep === 'BUY_BRIQS'">
        <Window size="w-[34rem]">
            <template #title>You need more briqs</template>
            <div class="mb-4 [&>p>b]:font-semibold">
                <p>You have <b>{{ chainBriqs?.getNbBriqs() || 0 }}</b> briqs in your wallet and the set you’re trying to mint requires <b>{{ setData.getNbBriqs() }}</b> briqs.<br>You need at least <b>{{ briqsNeeded }}</b> additional briqs to mint your set.</p>
            </div>
            <BuyBriqsWidget class="w-full" :minimum="briqsNeeded">
                <template #button="{ disabled, data }">
                    <div class="flex justify-between">
                        <Btn secondary @click="mintingError = ''; exportStep = ''" class="mr-2 !font-normal">Go back</Btn>
                        <Btn :disabled="disabled" @click="buyBriqsAndMint(data)">Buy and mint</Btn>
                    </div>
                </template>
            </BuyBriqsWidget>
        </Window>
    </template>
    <template v-else-if="exportStep === 'DONE'">
        <Window size="w-[40rem]">
            <template #title>Transaction sent <i class="pl-2 far fa-circle-check text-info-success"/></template>
            <p class="mb-2">
                The mint<template v-if="briqPendingObject">-and-buy</template> transaction was sent.<br>
                You can track its progress on <a :href="ExplorerTxUrl(TX?.transaction_hash || '')" class="text-primary">Starkscan</a>.
            </p>
            <p>You have been redirected to the set page.</p>
            <p class="my-4 [&>b]:font-semibold" v-if="briqPendingObject">
                You have bought <b>{{ briqPendingObject.quantity }}</b> briqs, and <b>{{ setData?.getNbBriqs() }}</b> briqs have been used in the set.<br>
                You now have <b>{{ chainBriqs?.getNbBriqs() }}</b> briqs.
            </p>
            <div class="flex justify-end mt-4">
                <Btn @click="emit('close')">Close</Btn>
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
                        <Btn no-background @click="mintingError = ''; exportStep = ''" class="mr-2">Go back</Btn>
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