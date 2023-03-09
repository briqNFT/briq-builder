<script setup lang="ts">
import { backendManager } from '@/Backend';
import { SetData } from '@/builder/SetData';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { Fetchable } from '@/DataFetching';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { number as num, Signature, constants } from 'starknet';
import { computed, ref, reactive, watchEffect } from 'vue';
import Footer from '../landing_page/Footer.vue';
import Header from '../landing_page/Header.vue';

const collectionName = ref('ducks_everywhere');

function toHex(str: string) {
    var result = '';
    for (var i=0; i<str.length; i++)
        result += str.charCodeAt(i).toString(16);

    return '0x' + result;
}

const tokenId = computed(() => contractStore.set?.precomputeTokenId(maybeStore.value!.userWalletAddress!, toHex(tokenName.value)) || '0x0');
const tokenName = ref('');
const tokenDescription = ref('');
const jsonData = ref<Fetchable<SetData>|undefined>(undefined);
const tokenImage = ref<Fetchable<string>|undefined>(undefined);
const bookletImage = ref<Fetchable<string>|undefined>(undefined);
const backgroundColor = ref('#000000');

const signature = ref<Fetchable<Signature>|undefined>(undefined);
const validatedData = ref<Fetchable<Record<string, any>>|undefined>(undefined);
const compiledShape = ref<Fetchable<Record<string, any>>|undefined>(undefined);
const mintResult = ref<Fetchable<string>|undefined>(undefined);

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

watchEffect(() => {
    tokenName.value;
    signature.value = undefined;
})
const sign = async () => {
    signature.value = new Fetchable();
    await signature.value.fetch(async () => await maybeStore.value!.signer!.signMessage({
        types: {
            StarkNetDomain: [
                { name: 'name', type: 'felt' },
                { name: 'version', type: 'felt' },
                { name: 'chainId', type: 'felt' },
            ],
            Message: [
                {
                    name: 'tokenId',
                    type: 'felt',
                },
            ],
        },
        domain: {
            'name': 'briq', 'version': '1', 'chainId': constants.StarknetChainId.TESTNET,
        },
        primaryType: 'Message',
        message: {
            tokenId: tokenId.value,
        },
    }));
}

const validate = async () => {
    validatedData.value = new Fetchable();
    await validatedData.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/validate_new_nft', {
        token_id: tokenId.value,
        data: getSetData(),
        owner: maybeStore.value!.userWalletAddress!,
        signature: signature.value?._data || [0, 0],
        preview_base64: tokenImage.value?._data,
        booklet_base64: bookletImage.value?._data,
        background_color: backgroundColor.value.slice(1),
    }));
    if (validatedData.value._error && validatedData.value._error?.message.indexOf('Invalid signature') !== -1)
        signature.value = undefined;
}

const compileShape = async () => {
    compiledShape.value = new Fetchable();
    compiledShape.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/compile_shape', {
        data: getSetData(),
        serial_number: validatedData.value!._data!.serial_number,
    }));
}

const mintToken = async () => {
    // Revalidate just in case
    await validate();
    await maybeStore.value!.ensureEnabled();
    mintResult.value = new Fetchable();
    await mintResult.value.fetch(async () => {
        backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/mint_new_nft', {
            token_id: tokenId.value,
            data: getSetData(),
            owner: maybeStore.value!.userWalletAddress!,
            signature: signature.value?._data || [0, 0],
            preview_base64: tokenImage.value?._data,
            booklet_base64: bookletImage.value?._data,
            background_color: backgroundColor.value.slice(1),
        });
        const declareResponse = await maybeStore.value!.signer.declare({
            contract: compiledShape.value?._data.contract_json,
            classHash: compiledShape.value?._data.class_hash,
        });
        const bookletTokenId = '0x' + num.toBN('3').add(num.toBN(validatedData.value?._data?.serial_number).mul(num.toBN('0x1000000000000000000000000000000000000000000000000'))).toString(16);
        let tx = await maybeStore.value!.signer!.execute([
            {
                contractAddress: ADDRESSES[getCurrentNetwork()].booklet,
                entrypoint: 'mint_',
                calldata: [maybeStore.value!.userWalletAddress, bookletTokenId, compiledShape.value!._data!.class_hash],
            },
            contractStore.set!.prepareAssemble(
                maybeStore.value!.userWalletAddress!,
                toHex(tokenName.value),
                jsonData.value!._data?.serialize(),
                bookletTokenId,
            ),
        ]);
        return tx.transaction_hash
    });
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
            <div class="flex gap-4 text-center">
                <div>
                    NFT Preview
                    <div class="bg-grad-light w-[14rem] h-[14rem]"><img class="max-h-full max-w-full" v-if="tokenImage?._status === 'LOADED'" :src="tokenImage._data"></div>
                </div>
                <div>
                    Booklet Preview
                    <div class="bg-grad-light w-[14rem] h-[14rem]"><img class="max-h-full max-w-full" v-if="bookletImage?._status === 'LOADED'" :src="bookletImage._data"></div>
                </div>
            </div>
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
            <template v-if="jsonData?._status === 'LOADED'">
                <p class="flex items-center mt-4">
                    Background color: <input type="color" class="w-12 h-6 mx-2" v-model="backgroundColor">
                </p>
                <p># of briqs: {{ jsonData._data!.getNbBriqs() }}</p>
                <p>Artist: {{ validatedData?._data?.booklet_meta.properties.artist.value || 'Validate to see' }}</p>
                <p>Date: {{ validatedData?._data?.booklet_meta.properties.date.value || 'Validate to see' }}</p>
                <p>Serial Number: {{ validatedData?._data?.serial_number || 'Validate to see' }}</p>
            </template>
            <p class="flex gap-2 my-4">
                <Btn :secondary="jsonData?._data" @click="uploadJson">Upload jsonData</Btn>
                <Btn :secondary="tokenImage?._data" @click="uploadImage">Upload NFT image</Btn>
                <Btn :secondary="bookletImage?._data" @click="uploadBooklet">Upload booklet image</Btn>
                <Btn :secondary="signature?._data" @click="sign">Sign</Btn>
                <Btn :secondary="validatedData?._data" @click="validate">Validate</Btn>
                <Btn :secondary="compiledShape?._data" @click="compileShape">Compile Cairo contract</Btn>
                <Btn :disabled="false && (!validatedData?._data || !compiledShape?._data)" @click="mintToken">Mint token</Btn>
            </p>
        </div>
    </div>
    <Footer/>
</template>