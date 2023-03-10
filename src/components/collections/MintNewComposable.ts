import { backendManager } from '@/Backend';
import { SetData } from '@/builder/SetData';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { Fetchable } from '@/DataFetching';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { number as num, Signature, constants } from 'starknet';
import { computed, ref, reactive, watchEffect } from 'vue';

function toHex(str: string) {
    let result = '';
    for (let i=0; i<str.length; i++)
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
    const fileHandles = await showOpenFilePickerPolyfill();
    for (const fileHandle of fileHandles)
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

const doValidate = async () => {
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
    await compiledShape.value.fetch(() => backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/compile_shape', {
        data: getSetData(),
        serial_number: validatedData.value!._data!.serial_number,
    }));
}


const mintToken = async () => {
    // Revalidate just in case
    await doValidate();
    await maybeStore.value!.ensureEnabled();
    mintResult.value = new Fetchable();
    await mintResult.value.fetch(async () => {
        const declareResponse = await maybeStore.value!.signer.declare({
            contract: compiledShape.value?._data.contract_json,
            classHash: compiledShape.value?._data.class_hash,
        });
        const bookletTokenId = '0x' + num.toBN('3').add(num.toBN(validatedData.value?._data?.serial_number).mul(num.toBN('0x1000000000000000000000000000000000000000000000000'))).toString(16);
        const tx = await maybeStore.value!.signer!.execute([
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
        backendManager.post('v1/admin/starknet-testnet/ducks_everywhere/mint_new_nft', {
            token_id: tokenId.value,
            data: getSetData(),
            owner: maybeStore.value!.userWalletAddress!,
            signature: signature.value?._data || [0, 0],
            preview_base64: tokenImage.value?._data,
            booklet_base64: bookletImage.value?._data,
            background_color: backgroundColor.value.slice(1),
        });
        return tx.transaction_hash
    });
}

export function useMintNew() {
    watchEffect(() => {
        tokenName.value;
        signature.value = undefined;
    })
    // Reset validation when data changes
    watchEffect(() => {
        tokenName.value;
        tokenDescription.value;
        jsonData.value;
        tokenImage.value;
        bookletImage.value;
        backgroundColor.value;

        validatedData.value = undefined;
    })
    return {
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
    }
}