<script setup lang="ts">
import { ExplorerTxUrl } from '@/chain/Explorer';
import { computed, onMounted, ref, watchEffect } from 'vue';
import Footer from '../landing_page/Footer.vue';
import Header from '../landing_page/Header.vue';
import { useMintNew } from './MintNewComposable';

const collectionName = ref('ducks_everywhere');

const {
    tokenId,
    tokenName,
    tokenDescription,
    jsonData,
    tokenImage,
    bookletImage,
    backgroundColor,

    signature,
    validatedData,
    compiledShape,
    mintResult,

    uploadJson,
    uploadImage,
    uploadBooklet,
    sign,
    doValidate,
    compileShape,
    mintToken,
} = useMintNew();

const actionIsPending = ref(false);

// General-case disabling
const disableBtns = computed(() => {
    return actionIsPending.value || reviewState.value !== 'CRAFTING'
})

const canValidate = computed(() => {
    return jsonData.value?._data && tokenImage.value?._data && bookletImage.value?._data;
})

const shouldValidate = computed(() => {
    return !signature.value?._data || !validatedData.value?._data || !compiledShape.value?._data;
})

const validate = async () => {
    actionIsPending.value = true;
    await sign();
    await doValidate();
    await compileShape();
    actionIsPending.value = false;
}

const startMint = async () => {
    actionIsPending.value = true;
    await mintToken();
    actionIsPending.value = false;
}

const reviewState = ref('CRAFTING' as 'CRAFTING' | 'REVIEW' | 'READY');
watchEffect(() => {
    if (!validatedData.value)
        reviewState.value = 'CRAFTING';
})
const startReview = async () => {
    reviewState.value = 'REVIEW';
    reviewStep.value = 0;
}
const notOk = async () => {
    validatedData.value = undefined;
}
const markReady = async () => {
    if (reviewStep.value < dataToReview.value.children.length - 1) {
        reviewStep.value++;
        return;
    }
    reviewState.value = 'READY';
}

const reviewStep = ref(0);
const dataToReview = ref(null as unknown as HTMLDivElement);
const positionReviewBtn = computed(() => {
    let pos = dataToReview.value.getBoundingClientRect().top;
    pos = dataToReview.value.children[reviewStep.value].getBoundingClientRect().top - pos;
    return { top: `${pos}px` };
})
watchEffect(() => {
    if (!dataToReview.value)
        return;
    for (let i = 0; i < dataToReview.value.children.length; i++) {
        const el = dataToReview.value.children[i];
        if (i < reviewStep.value && reviewState.value === 'REVIEW' || reviewState.value === 'READY')
            el.classList.add('bg-green-200');
        else if (i === reviewStep.value && reviewState.value === 'REVIEW')
            el.classList.add('bg-grad-light');
        else {
            el.classList.remove('bg-grad-light');
            el.classList.remove('bg-green-200');
        }
    }
})
</script>

<style scoped>
.dataToReview > * {
    @apply p-2;
}
</style>
<template>
    <Header/>
    <div class="container m-auto py-8">
        <h1 class="text-center">Manage your collection</h1>
        <h3>{{ collectionName }}</h3>
        <p class="text-primary"><router-link :to="{ name: 'Theme', params: { theme: collectionName } }">See theme page</router-link></p>
        <div class="my-8 py-4">
            <h2>Mint a new NFT</h2>
            <div class="grid grid-cols-[16rem,auto] gap-8 my-4">
                <div class="flex flex-col gap-1 break-all">
                    <Btn :disabled="disableBtns" :secondary="jsonData?._data" @click="uploadJson">Upload jsonData</Btn>
                    <Btn :disabled="disableBtns || !jsonData?._data" :secondary="tokenImage?._data" @click="uploadImage">Upload NFT image</Btn>
                    <Btn :disabled="disableBtns || !jsonData?._data" :secondary="bookletImage?._data" @click="uploadBooklet">Upload booklet image</Btn>
                    <p>Select background color:<br><input type="color" class="w-full h-8" v-model="backgroundColor"></p>
                    <Btn :disabled="disableBtns || !canValidate" :secondary="!shouldValidate" @click="validate">Validate</Btn>
                    <Btn
                        :disabled="disableBtns || !validatedData?._data || !compiledShape?._data || shouldValidate"
                        @click="startReview">
                        Review and Mint
                    </Btn>
                    <template v-if="jsonData?._data">
                        <p>JSON uploaded OK</p>
                    </template>
                    <template v-if="jsonData?._status === 'ERROR'">
                        <p class="text-info-error font-semibold">Error uploading the JSON</p>
                        <p class="font-mono text-sm break-all bg-grad-light p-1 rounded-sm">{{ jsonData._error }}</p>
                    </template>
                    <template v-if="signature?._status === 'LOADED'">
                        <p>Signature: OK</p>
                    </template>
                    <template v-if="validatedData?._status === 'LOADED'">
                        <p>Validation: OK</p>
                    </template>
                    <template v-else-if="validatedData?._status === 'ERROR'">
                        <p class="text-info-error font-semibold">Validation error</p>
                        <p class="font-mono text-sm break-all bg-grad-light p-1 rounded-sm">{{ validatedData._error }}</p>
                    </template>
                    <template v-if="compiledShape?._status === 'LOADED'">
                        <p>Contract Class Hash: {{ compiledShape._data!.class_hash }}</p>
                    </template>
                    <template v-if="compiledShape?._status === 'ERROR'">
                        <p class="text-info-error font-semibold">Error compiling contract</p>
                        <p class="font-mono text-sm break-all bg-grad-light p-1 rounded-sm">{{ compiledShape._error }}</p>
                    </template>
                    <p v-show="actionIsPending"><i class="fas fa-spinner animate-spin-slow"/></p>
                </div>
                <div class="relative">
                    <div ref="dataToReview" class="flex flex-col dataToReview" v-if="jsonData?._data">
                        <p>Token ID: {{ tokenId }} (auto-generated)</p>
                        <p class="min-w-[30rem]">
                            Token name<br>
                            <input type="text" class="w-full  max-w-[40rem]" placeholder="New Duck" v-model="tokenName">
                        </p>
                        <p>
                            Description<br>
                            <textarea class="w-full  max-w-[40rem]" v-model="tokenDescription"/>
                        </p>
                        <div class="flex gap-4 text-center">
                            <div>
                                NFT Preview
                                <div @click="uploadImage" class="bg-grad-light w-[14rem] h-[14rem]"><img class="max-h-full max-w-full" v-if="tokenImage?._status === 'LOADED'" :src="tokenImage._data"></div>
                            </div>
                            <div>
                                Booklet Preview
                                <div @click="uploadBooklet" class="bg-grad-light w-[14rem] h-[14rem]"><img class="max-h-full max-w-full" v-if="bookletImage?._status === 'LOADED'" :src="bookletImage._data"></div>
                            </div>
                        </div>
                        <p class="flex items-center">
                            Background color: <input type="color" class="w-12 h-6 mx-2" v-model="backgroundColor">
                        </p>
                        <p># of briqs: {{ jsonData._data!.getNbBriqs() }}</p>
                        <p>Artist: {{ validatedData?._data?.booklet_meta.properties.artist.value || 'Validate to see' }}</p>
                        <p>Date: {{ validatedData?._data?.booklet_meta.properties.date.value || 'Validate to see' }}</p>
                        <p>Serial Number: {{ validatedData?._data?.serial_number || 'Validate to see' }}</p>
                    </div>
                    <template v-if="!mintResult?._data">
                        <div v-if="reviewState === 'REVIEW'" class="absolute right-0 flex gap-2" :style="positionReviewBtn">
                            <Btn secondary @click="notOk">Not OK</Btn>
                            <Btn @click="markReady">Item is OK</Btn>
                        </div>
                        <div class="flex items-center justify-end gap-4 my-4" v-if="reviewState !== 'CRAFTING'">
                            <p class="font-medium">WARNING: You cannot go back after signing the first Minting transaction</p>
                            <Btn :disabled="actionIsPending || reviewState !== 'READY'" @click="startMint">Mint</Btn>
                        </div>
                    </template>
                </div>
            </div>
            <div v-if="mintResult?._data">
                <h2>Minting in progress</h2>
                <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(mintResult._data)" target="_blank">Starkscan</a></p>
            </div>
            <div v-if="mintResult?._error">
                <h2 class="text-info-error">There was an error when minting</h2>
                <p>Please contact the briq team with some information on what happened (e.g. a screenshot of this page).</p>
                <p class="font-mono text-sm break-all bg-grad-light p-1 rounded-sm">{{ mintResult._error }}</p>
            </div>
        </div>
    </div>
    <Footer/>
</template>