<script setup lang="ts">
import { backendManager } from '@/Backend';
import { SetData } from '@/builder/SetData';
import { maybeStore } from '@/chain/WalletLoading';
import { Fetchable } from '@/DataFetching';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { Account, DeclareSignerDetails } from 'starknet';
import { computed, ref } from 'vue';
import Footer from '../landing_page/Footer.vue';
import Header from '../landing_page/Header.vue';

const collectionName = ref('ducks_everywhere');

const tokenId = computed(() => '0xcafe');
const tokenName = ref('');
const tokenDescription = ref('');
const jsonData = ref<Fetchable<SetData>|undefined>(undefined);
const tokenImage = ref<Fetchable<string>|undefined>(undefined);
const bookletImage = ref<Fetchable<string>|undefined>(undefined);
const backgroundColor = ref('#000000');

const validatedData = ref<Fetchable<Record<string, any>>|undefined>(undefined);
const compiledShape = ref<Fetchable<Record<string, any>>|undefined>(undefined);
const mintResult = ref<Fetchable<Record<string, any>>|undefined>(undefined);

const getFile = async (): Promise<File> => {
    let fileHandles = await showOpenFilePickerPolyfill();
    for (let fileHandle of fileHandles)
        return await fileHandle.getFile();
    throw new Error('No file uploaded');
}

const uploadJson = async () => {
    jsonData.value = undefined;
    jsonData.value = new Fetchable();
    await jsonData.value.fetch(async () =>  {
        const file = await getFile();
        const data = JSON.parse(await file!.text());
        data.id = tokenId.value;
        return new SetData(tokenId.value).deserialize(data);
    });
    if (!tokenName.value)
        tokenName.value = jsonData.value._data!.name;
    if (!tokenDescription.value)
        tokenDescription.value = jsonData.value._data!.description;
}

const _image = async (ref: any) => {
    ref.value = undefined;
    ref.value = new Fetchable();
    await ref.value.fetch(async () => {
        const file = await getFile();
        const fr = new FileReader();
        fr.readAsDataURL(file);
        return new Promise((resolve) => {
            fr.onload = () => {
                resolve(fr.result);
            }
        });
    });
}

const uploadImage = async () => {
    await _image(tokenImage);
}

const uploadBooklet = async () => {
    await _image(bookletImage);
}

const getSetData = () => {
    if (!jsonData.value?._data)
        return undefined;
    const ret = jsonData.value._data.serialize();
    ret.name = tokenName.value;
    ret.description = tokenDescription.value;
    return ret;
}

const validate = async () => {
    validatedData.value = new Fetchable();
    validatedData.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/validate_new_nft', {
        token_id: tokenId.value,
        data: getSetData(),
        preview_base64: tokenImage.value?._data,
        booklet_base64: bookletImage.value?._data,
        background_color: backgroundColor.value.slice(1),
    }));
}

const compileShape = async () => {
    compiledShape.value = new Fetchable();
    compiledShape.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/compile_shape', {
        token_id: tokenId.value,
        data: getSetData(),
        preview_base64: tokenImage.value?._data,
        booklet_base64: bookletImage.value?._data,
        background_color: backgroundColor.value.slice(1),
    }));
}

const mintToken = async () => {
    //console.log(maybeStore.value!.signer)
    //const acc = new Account(maybeStore.value!.signer, maybeStore.value?.userWalletAddress, maybeStore.value!.signer)
    const declareResponse = await maybeStore.value!.signer.declare({
        contract: compiledShape.value?._data.contract_json,
        classHash: compiledShape.value?._data.class_hash,
    });

    mintResult.value = new Fetchable();
    mintResult.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/mint_new_nft', {
        token_id: tokenId.value,
        data: getSetData(),
        preview_base64: tokenImage.value?._data,
        booklet_base64: bookletImage.value?._data,
        background_color: backgroundColor.value.slice(1),
    }));
}
</script>

<template>
    <Header/>
    <div class="container m-auto py-8">
        <h1 class="text-center">Manage your collection</h1>
        <h3>{{ collectionName }}</h3>
        <p class="text-primary"><router-link :to="{ name: 'Theme', params: { theme: collectionName } }">See theme page</router-link></p>
        <div class="my-8 py-4">
            <h2>Mint a new NFT</h2>
            <div>
                <Btn secondary @click="uploadJson">Upload jsonData</Btn>
                <template v-if="jsonData?._status === 'ERROR'">
                    <p class="font-mono text-sm bg-grad-light p-2 rounded-sm">Error: {{ jsonData._error }}</p>
                </template>
            </div>
            <p>Token ID: {{ tokenId }} (auto-generated)</p>
            <p class="min-w-[30rem]">
                Token name<br>
                <input type="text" class="w-full  max-w-[40rem]" placeholder="New Duck" v-model="tokenName">
            </p>
            <p>
                Description<br>
                <textarea class="w-full  max-w-[40rem]" v-model="tokenDescription"/>
            </p>
            <p>
                <Btn secondary @click="uploadImage">Upload NFT image</Btn>
                <img class="max-w-[20rem] max-h-[20rem]" v-if="tokenImage?._status === 'LOADED'" :src="tokenImage._data">
            </p>
            <p>
                <Btn secondary @click="uploadBooklet">Upload booklet image</Btn>
                <img class="max-w-[20rem] max-h-[20rem]" v-if="bookletImage?._status === 'LOADED'" :src="bookletImage._data">
            </p>
            <p class="flex items-center">
                Background color: <input type="color" class="w-12 h-8 mx-2" v-model="backgroundColor">
            </p>
            <div>
                Attribute validation:
                <template v-if="jsonData?._status === 'LOADED'">
                    <p># of briqs: {{ jsonData._data!.getNbBriqs() }}</p>
                    <p>Artist: {{ validatedData?._data?.booklet_meta.properties.artist.value || 'Validate to see' }}</p>
                    <p>Date: {{ validatedData?._data?.booklet_meta.properties.date.value || 'Validate to see' }}</p>
                    <p>Serial Number: {{ validatedData?._data?.serial_number || 'Validate to see' }}</p>
                </template>
            </div>
            <p>
                <Btn @click="validate">Validate</Btn>
                <Btn @click="compileShape" :disabled="compiledShape?._fetch && !compiledShape?._data">Compile Cairo contract</Btn>
                <Btn :disabled="false && (!validatedData?._data || !compiledShape?._data)" @click="mintToken">Mint token</Btn>
            </p>
        </div>
    </div>
    <Footer/>
</template>