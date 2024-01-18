<script setup lang="ts">
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';
import { pushPopup } from '@/Notifications';
import { SetData } from '@/builder/SetData';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { walletStore } from '@/chain/Wallet';
import { ref, onMounted, computed, watchEffect, reactive } from 'vue';
import { Fetchable } from '@/DataFetching';
import { getCurrentNetwork, getPremigrationNetwork } from '@/chain/Network';
import { adminBackendManager, backendManager } from '@/Backend';
import { useGenesisStore } from '@/builder/GenesisStore';
import type { Account, Call } from 'starknet';
import { bookletDataStore } from '@/builder/BookletData';
import { pushModal } from '../Modals.vue';
import TextModal from '../generic/TextModal.vue';
import RecipientMappingModal from './RecipientMappingModal.vue';
import TraitModal from './TraitModal.vue';
import { getCalls } from './migrate';
import { getBookletAddress } from '@/chain/Collections';
import { hexUuid } from '@/Uuid';
import ProgressModal from './ProgressModal.vue';
import { authStore, checkAuth } from '@/Auth';

class SetToMint {
    filename: string;
    data: SetData;
    preview_b64: string | null;
    booklet_b64: string | null;
    attribute_id: string | null;

    constructor(f: string, data: SetData) {
        this.filename = f;
        this.data = data;
        this.preview_b64 = null;
        this.booklet_b64 = null;
        this.attribute_id = null;
    }
}

const setsToMint = ref([] as Fetchable<SetToMint>[]);

const genesisStore = useGenesisStore();
const collection = ref('');
const collectionData = {
    'starknet_planet': '0x1',
    'briqmas': '0x2',
    'ducks_everywhere': '0x3',
    'ducks_frens': '0x4',
    'lil_ducks': '0x5',
} as const;
const assemblyGroupId = computed(() => (collectionData[collection.value] ?? null));

const existingItems = ref({});

const loadedItems = (collection: string) => {
    const all = Object.keys(existingItems.value[collection] || {});
    return all.filter(x => x in bookletDataStore[getCurrentNetwork()]);
}

// Load existing items based on current collection
watchEffect(async () => {
    if (collection.value === '')
        return;
    if (!existingItems.value[collection.value]) {
        const data = await backendManager.fetch(`v1/${getCurrentNetwork()}/${collection.value}/object_ids`);
        existingItems.value[collection.value] = data;
    }
});


const importFiles = async () => {
    let files = [] as File[];
    let fileHandles = await showOpenFilePickerPolyfill({ multiple: true });
    for (let fileHandle of fileHandles)
        try {
            let file = await fileHandle.getFile();
            files.push(file);
        } catch (err) {
            pushPopup('error', 'Error loading file', `Error while loading file ${fileHandle.name}\n${err?.message}`);
            console.error(err);
        }
    return files;
}

const importJsons = async () => {
    let jsons = await importFiles();
    setsToMint.value = [];
    for (let jsondata of jsons)
        try {
            let contents = JSON.parse(await jsondata.text());
            let set = new SetData(contents.id).deserialize(contents);
            // TODO -> add token ID here
            set.id = contractStore.set!.precomputeTokenId(walletStore.userWalletAddress, set.id, set.getNbBriqs(), null);
            const ftch = new Fetchable<SetToMint>();
            await ftch.fetch(async () => {
                const ret = new SetToMint(jsondata.name.replace('.json', ''), set);
                ret.attribute_id = existingItems.value?.[collection.value]?.[`${collection.value}/${ret.data.name}`] || 0;
                ret.attribute_id = (BigInt(ret.attribute_id) & BigInt('0xffffffffffffffff')).toString(10);
                return ret;
            });
            console.log(ftch._error)
            setsToMint.value.push(ftch);
        } catch(err) {
            pushPopup('error', 'Error loading file', `Error while parsing set ${jsondata.name}\n${err?.message}`);
            console.error(err);
        }
}

const importPreviews = async (to: 'preview_b64' | 'booklet_b64') => {
    let previews = await importFiles();
    for (let preview of previews)
        try {
            let contents = await preview.arrayBuffer();
            let set = setsToMint.value.find(s => {
                if (s._data?.filename === preview.name.replace('.png', ''))
                    return true;
                if (s._data?.data.name === preview.name.replace('.png', ''))
                    return true;
                if (setsToMint.value.length === 1)
                    return true;
                return false;
            });
            if (!set) {
                pushPopup('error', 'Error loading file', `Preview ${preview.name} has no corresponding set`);
                continue;
            }
            const blob = new Blob([contents], { type: 'image/png' });
            const reader = new FileReader();
            reader.onload = () => {
                set!._data![to] = reader.result as string;
            };
            reader.readAsDataURL(blob);
        } catch(err) {
            pushPopup('error', 'Error loading file', `Error while parsing preview ${preview.name}\n${err?.message}`);
            console.error(err);
        }
}

const storeObjects = async () => {
    const bookletSpec = {};
    for (const set of setsToMint.value) {
        const val = BigInt(+set._data!.attribute_id) + BigInt(assemblyGroupId.value!) * BigInt('0x10000000000000000');
        bookletSpec[`${collection.value}/${set._data!.data.name}`] = '0x' + val.toString(16);
    }

    await adminBackendManager.post(`v1/admin/update_booklet_spec/${getCurrentNetwork()}/${collection.value}`, {
        booklet_spec: bookletSpec,
    });
    const steps = reactive([] as unknown[]);
    for (const set of setsToMint.value) {
        const step = reactive(new Fetchable());
        step.fetch(async () => {
            return await adminBackendManager.post(`v1/admin/store_theme_object/${getCurrentNetwork()}/${collection.value}/${set._data!.data.name}`, {
                data: set._data?.data.serialize(),
                preview_base64: set._data?.preview_b64,
                booklet_base64: set._data?.booklet_b64,
            });
        });
        steps.push({
            name: set._data!.data.name,
            task: step,
        });
    }
    await pushModal(ProgressModal, {
        steps,
    });
}

const updateTraits = async () => {
    const mapping = await pushModal(TraitModal) as Record<string, Record<string, string>>;
    if (!mapping)
        return;
    // add collection name to all items
    const newMapping = {} as Record<string, Record<string, string>>;
    for (const item in mapping)
        newMapping[`${collection.value}/${item}`] = mapping[item];
    // Ensure we have a perfect mapping with known items
    const knownItems = Object.keys(existingItems.value?.[collection.value] || {});
    const knownTraits = Object.keys(newMapping).filter(x => knownItems.includes(x));
    if (knownTraits.length !== knownItems.length) {
        // print out difference
        const unknownItems = Object.keys(newMapping).filter(x => !knownItems.includes(x));
        pushPopup('error', 'Error', `You must provide a mapping for all known items. Missing: ${unknownItems.join(', ')}`);
        return;
    }
    return await adminBackendManager.post(`v1/admin/update_traits/${getCurrentNetwork()}/${collection.value}`, {
        data: mapping,
    });
}

const generateGLBs = async () => {
    const steps = reactive([]);
    for (const item in existingItems.value?.[collection.value] || {}) {
        if (!(item in bookletDataStore[getCurrentNetwork()]))
            continue;
        const data = await bookletDataStore[getCurrentNetwork()][item]._fetch!;
        if (!data)
            continue;
        const step = reactive(new Fetchable());
        step.fetch(async () => {
            return await adminBackendManager.post(`v1/admin/update_glbs/${getCurrentNetwork()}/${item}`, {
                data: data,
                preview_base64: '',
                booklet_base64: '',
            });
        });
        steps.push({
            name: item,
            task: step,
        });
    }
    await pushModal(ProgressModal, {
        steps,
    });
}

const loadAll = async () => {
    for (const item in existingItems.value?.[collection.value] || {})
        bookletDataStore[getCurrentNetwork()][item];

}

const deployShapeContracts = async () => {
    const data = {} as Record<string, unknown>;
    for (const item in existingItems.value?.[collection.value] || {}) {
        if (!(item in bookletDataStore[getCurrentNetwork()]))
            continue;
        if (!bookletDataStore[getCurrentNetwork()][item]._data)
            continue;
        const attribute_id = bookletDataStore[getCurrentNetwork()][item]._data!.serial_number.toString(16);
        data['0x' + attribute_id] = bookletDataStore[getCurrentNetwork()][item]._data!.briqs;
    }
    const jsonData = await adminBackendManager.post('v1/admin/compile_shape_contract/', {
        shapes_by_attribute_id: data,
    });
    const parsedSierra = JSON.parse(jsonData.sierra);
    const parsedCasm = JSON.parse(jsonData.casm);
    const classHash = (await (walletStore.signer)!.declare({
        contract: parsedSierra,
        casm: parsedCasm,
    }))!.class_hash;
    //let classHash = '0x0732fa75c94e08557cf09bec3a32ad4b80c3f6ca211e9126d48ea9f386c070b8';
    //console.log('argent', classHash);
    //classHash = hash.computeSierraContractClassHash(parsedSierra);
    //console.log('mine', hash.computeSierraContractClassHash(parsedSierra));
    await walletStore.signer!.execute(Object.keys(data).map(x => ({
        contractAddress: ADDRESSES[getCurrentNetwork()].register_shape_validator,
        entrypoint: 'execute',
        calldata: [
            ADDRESSES[getCurrentNetwork()].world,
            assemblyGroupId.value!,
            x,
            classHash,
        ],
    })))
}

const start_auth = async () => {
    const message_to_sign = await adminBackendManager.fetch(`v1/auth/start/${getCurrentNetwork()}/${walletStore.userWalletAddress}`)
    const signature = await (walletStore.signer as Account).signMessage(message_to_sign.challenge);
    await adminBackendManager.post('v1/auth/finish', { signature });
    checkAuth();
}

const mintBoxes = async () => {
    const mapping = await pushModal(RecipientMappingModal) as Record<string, string>;
    walletStore.signer?.execute(
        Object.keys(mapping).map(recipient => ({
            contractAddress: ADDRESSES[getCurrentNetwork()].box,
            entrypoint: 'mint',
            calldata: [
                recipient,
                mapping[recipient],
                1],
        })),
    );
}

const getOfficialSetPreview = async (booklet: string) => {
    const bookletImage = fetch(genesisStore.coverItemRoute(booklet) + '?no-cache-please');
    const imageBlob = (await (await bookletImage).blob());
    const image_base64 = await new Promise(yes => {
        const reader = new FileReader() ;
        reader.onload = _ => reader.result && yes(reader.result);
        reader.readAsDataURL(imageBlob);
    });
    return image_base64 as string;
}

const mintSets = async () => {
    const mapping = await pushModal(RecipientMappingModal, {
        initialMapping: loadedItems(collection.value).reduce((acc, val) => {
            acc[val] = walletStore.userWalletAddress!;
            return acc;
        }, {} as Record<string, string>),
    }) as Record<string, string>;

    const calls = [] as Call[];
    for (const booklet in mapping) {
        const recipient = mapping[booklet];
        const bookletData = bookletDataStore[getCurrentNetwork()][booklet]._data!;
        if (!bookletData)
            throw new Error(`Booklet ${booklet} not loaded`);
        // Mint the booklet
        const contract = getBookletAddress(ADDRESSES[getCurrentNetwork()], booklet.split('/')[0]);
        calls.push({
            contractAddress: contract,
            entrypoint: 'mint',
            calldata: [
                recipient,
                bookletData.token_id,
                1,
            ],
        });
        // Then mint the set
        const tokenHint = hexUuid();
        const futureTokenId = contractStore.set!.precomputeTokenId(recipient, tokenHint, bookletData.briqs.length, booklet, bookletData);
        calls.push(contractStore.set!.prepareAssemble(recipient, tokenHint, bookletData, bookletData.token_id));
        // Immediately hint to the backend
        await backendManager.storeSet({
            chain_id: getCurrentNetwork(),
            owner: walletStore.userWalletAddress!,
            token_id: futureTokenId,
            data: bookletData,
            image_base64: await getOfficialSetPreview(booklet),
        });

    }
    console.log('totoro', calls);
    await walletStore.sendTransaction(calls);
}

const migrationData = reactive(new Fetchable<{ set_migrations: { old_token_id: string, new_token_id: string }[], calls: Call[] }>());

watchEffect(() => {
    if (migrationData?._data)
        window.localStorage.setItem('migration_calls', JSON.stringify(migrationData._data!));

})

onMounted(() => {
    checkAuth();
    try {
        const calls = window.localStorage.getItem('migration_calls');
        if (calls && calls.length)
            migrationData.fetch(async () => JSON.parse(calls));
    } catch(_) {}
})

const migrate = async () => {
    const mapping = await pushModal(RecipientMappingModal) as Record<string, unknown>;
    if (!mapping)
        return;
    migrationData.fetch(async () => {
        return await getCalls(mapping);
    });
    //await walletStore.sendTransaction(calls);
}

const migrateSetData = async () => {
    await Promise.all(migrationData._data!.set_migrations.map(x => {
        return backendManager.post('v1/migrate_set', {
            old_chain_id: getPremigrationNetwork(getCurrentNetwork()),
            old_token_id: x.old_token_id,
            chain_id: getCurrentNetwork(),
            token_id: x.new_token_id,
        });
    }));
}

const estimateFees = async () => {
    // Split calls in equal buckets
    const size = 200;
    const buckets = [[]];
    for (let i = 0; i < Math.min(size, migrationData._data?.calls.length); ++i) {
        buckets[buckets.length - 1].push(migrationData._data!.calls[i]);
        if (buckets[buckets.length - 1].length == size)
            buckets.push([]);
    }
    //return walletStore.sendTransaction(buckets[0]);
    const fees = await Promise.allSettled(buckets.map(calls => {
        return walletStore.signer!.estimateInvokeFee(calls, { skipValidate: true })
    }));
    console.log('totoro', fees);
}

const mintStuff = async () => {
    // Split calls in equal buckets
    const size = 200;
    const buckets = [[]];
    for (let i = 0; i < Math.min(size, migrationData._data?.calls.length); ++i) {
        buckets[buckets.length - 1].push(migrationData._data!.calls[i]);
        if (buckets[buckets.length - 1].length == size)
            buckets.push([]);
    }
    const start = parseInt(window.localStorage.getItem('migration_step') || '0');
    for (let i = start; i < buckets.length; ++i) {
        await walletStore.sendTransaction(buckets[i]);
        window.localStorage.setItem('migration_step', i.toString());
    }
}

</script>

<template>
    <Header/>
    <div class="m-auto container">
        <h1 class="text-center my-4">Mass mint</h1>
        <Btn v-if="!authStore.authenticated" @click="start_auth">Connect</Btn>
        <div v-if="authStore.authenticated" class="my-4">
            <p>You are currently authenticated as admin</p>
            <Btn secondary @click="authStore.authenticated = false">Disconnect</Btn>
        </div>
        <div>
            <p>Network: {{ getCurrentNetwork() }} (adjust by changing wallet)</p>
            <p>
                Collection: <select v-model="collection">
                    <option value="">None</option>
                    <option v-for="key, val in collectionData" :key="key" :value="val">{{ val }}</option>
                </select>
            </p>
            <div>
                <p>
                    <Btn :disabled="!collection" @click="importJsons">Import JSON files</Btn>
                    <Btn :disabled="!collection" @click="importPreviews('preview_b64')">Import Preview files</Btn>
                    <Btn :disabled="!collection" @click="importPreviews('booklet_b64')">Import Booklet files</Btn>
                </p>
                <p>
                    <Btn :disabled="!collection" @click="storeObjects">Store new items</Btn>
                </p>
                <table>
                    <tr><th>serial number</th><th>file</th><th>Name</th><th>ID</th><th>NB briqs</th><th>Preview</th><th>Booklet ID</th><th>Booklet</th><th>AGID</th></tr>
                    <tr v-for="setToMint, i in setsToMint" :key="i">
                        <td><input v-if="setToMint._data" type="text" size="3" v-model="setToMint._data!.attribute_id"></td>
                        <td>{{ setToMint._data?.filename }}</td>
                        <td>{{ setToMint._data?.data.name }}</td>
                        <td class="text-xs">{{ setToMint._data?.data.id }}</td>
                        <td>{{ setToMint._data?.data.getNbBriqs() }}</td>
                        <td><img class="w-16" v-if="setToMint._data?.preview_b64" :src="setToMint._data?.preview_b64"></td>
                        <td>{{ collection ? `${collection}/${setToMint._data?.data.name}`: 'N/A' }}</td>
                        <td><img class="w-16" v-if="collection && setToMint._data?.booklet_b64" :src="setToMint._data?.booklet_b64"></td>
                        <td>{{ assemblyGroupId }}</td>
                    </tr>
                </table>
            </div>
            <p>
                Trucs à rajouter:
                - Mode "select" ou je peux up-down et voir que la data est bonne ou pas rapidement.
                - Check si la data est déjà sur le serveur, si non upload
                - Une colonne customisable?
                - Bouton pour loader des images (même ID / même nom ?)
                - Montrer les images en petit
                - Pareil booklet
                - Ajouter attributs (à partir d'un json?)
                - synchro backend
                - Il me faut aussi register un shape contract
                - Ajouter destinataire du mint (à partir d'un json)
            </p>
            <hr class="my-6">
            <h4>Existing items in this collection:</h4>
            <Btn @click="loadAll">Load all</Btn>
            <Btn @click="updateTraits">Update Traits</Btn>
            <Btn @click="generateGLBs">Generate GLB data</Btn>
            <Btn @click="deployShapeContracts">Deploy missing shape contract(s)</Btn>
            <Btn :disabled="true" @click="mintBoxes">Mint Boxes</Btn>
            <Btn @click="mintSets">Mint Sets</Btn>
            <table>
                <tr>
                    <th>Object ID</th>
                    <th>Booklet metadata</th>
                    <th>Name</th>
                    <th>Serial #</th>
                    <th>Images</th>
                    <th>Shape Contract</th>
                    <th>Booklet owners</th>
                </tr>
                <tr v-for="id, name in existingItems?.[collection] ?? {}" :key="name">
                    <td>{{ name }}</td>
                    <template v-if="name in bookletDataStore[getCurrentNetwork()] && bookletDataStore[getCurrentNetwork()][name]._data">
                        <td>
                            <Btn
                                secondary
                                @click="() => pushModal(TextModal, {
                                    text: JSON.stringify(bookletDataStore[getCurrentNetwork()][name]._data, null, 4)
                                })">
                                Show metadata
                            </Btn>
                        </td>
                        <td>
                            {{ bookletDataStore[getCurrentNetwork()][name]._data.name }}
                        </td>
                    </template>
                    <td v-else-if="id in bookletDataStore[getCurrentNetwork()]">
                        {{ bookletDataStore[getCurrentNetwork()][name]._status }}
                    </td>
                    <template v-else>
                        <td>
                            <Btn no-background @click="() => bookletDataStore[getCurrentNetwork()][name]">
                                Load
                            </Btn>
                        </td>
                        <td/>
                    </template>
                    <td>
                        {{ id }}
                    </td>
                    <td><img class="w-12" :src="genesisStore.coverBookletRoute(name, true)"></td>
                </tr>
            </table>
            <hr class="my-6">
            <h2>Migration</h2>
            <Btn @click="migrate">Setup calls</Btn>
            <Btn :disabled="!migrationData._data?.set_migrations?.length" @click="migrateSetData">Migrate Set data</Btn>
            <Btn :disabled="!migrationData._data?.calls?.length" @click="estimateFees">Estimate Fees</Btn>
            <Btn :disabled="!migrationData._data?.calls?.length" @click="mintStuff">Actually Migrate</Btn>
            <div v-if="migrationData._status == 'LOADED'">
                <p>Total calls: {{ migrationData._data!.calls.length }}</p>
                <p v-for="(value, key) in ADDRESSES[getCurrentNetwork()]" :key="key">
                    Calls to {{ key }}: {{
                        migrationData._data!.calls.filter(x => x.contractAddress == value).map(x => +x.calldata?.[2] || 1).reduce((a, b) => a + b, 0)
                    }}
                </p>
                <div>
                    <p v-for="val in migrationData._data!.set_migrations">{{ val }}</p>
                </div>
            </div>
            <div v-else-if="migrationData._error">
                <p>Error: {{ migrationData._error }}</p>
            </div>
        </div>
    </div>
    <Footer/>
</template>