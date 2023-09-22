<script setup lang="ts">
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import Footer from '../landing_page/Footer.vue';
import Header from '../landing_page/Header.vue';
import { pushPopup } from '@/Notifications';
import { SetData } from '@/builder/SetData';
import contractStore from '@/chain/Contracts';
import { walletStore } from '@/chain/Wallet';
import { ref, onMounted, computed, watchEffect } from 'vue';
import { Fetchable } from '@/DataFetching';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { useGenesisStore } from '@/builder/GenesisStore';
import { Account } from 'starknet';
import { bookletDataStore } from '@/builder/BookletData';
import { pushModal } from '../Modals.vue';
import TextModal from '../generic/TextModal.vue';

onMounted(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
    }
    document.body.appendChild(script);
});

class SetToMint {
    filename: string;
    data: SetData;
    preview_b64: string | null;
    booklet_b64: string | null;

    constructor(f: string, data: SetData) {
        this.filename = f;
        this.data = data;
        this.preview_b64 = null;
        this.booklet_b64 = null;
    }
}

const setsToMint = ref([] as Fetchable<SetToMint>[]);

const genesisStore = useGenesisStore();
const collection = ref('');
const assemblyGroupId = computed(() => ({
    'ducks_everywhere': '0x1',
}[collection.value] ?? null));

const existingItems = ref({});

watchEffect(async () => {
    if (collection.value === '')
        return;
    if (!existingItems[collection.value]) {
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
            set.id = contractStore.set!.precomputeTokenId(walletStore.userWalletAddress, set.id, set.getNbBriqs());
            console.log(set);
            const ftch = new Fetchable<SetToMint>();
            ftch.fetch(async () => new SetToMint(jsondata.name.replace('.json', ''), set));
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

const storeObjects = () => {
    for (const set of setsToMint.value)
        backendManager.post(`v1/admin/store_theme_object/${getCurrentNetwork()}/${collection.value}/${set._data?.data.name}`, {
            data: set._data?.data.serialize(),
            preview_base64: set._data?.preview_b64,
            booklet_base64: set._data?.booklet_b64,
        });
}

const start_auth = async () => {
    const message_to_sign = await backendManager.fetch(`v1/auth/start/${getCurrentNetwork()}/${walletStore.userWalletAddress}`)
    const signature = await (walletStore.signer as Account).signMessage(message_to_sign.challenge);
    const res = await backendManager.post('v1/auth/finish', { signature });
}
</script>

<template>
    <Header/>
    <div class="m-auto container">
        <h1 class="text-center my-4">Mass mint</h1>
        <div class="w-min">
            <div
                id="g_id_onload"
                data-client_id="703585634285-7i7hcnfipr51t37s0r5ggkja2batge5t.apps.googleusercontent.com"
                data-context="signin"
                data-ux_mode="popup"
                data-login_uri="/login"
                data-auto_prompt="false"/>

            <div
                class="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="outline"
                data-text="signin_with"
                data-size="large"
                data-logo_alignment="left"/>
        </div>
        <Btn @click="start_auth">Connect</Btn>
        <div>
            <h3>Minting</h3>
            <p>Network: {{ getCurrentNetwork() }}</p>
            <Btn @click="importJsons">Import JSON files</Btn>
            <Btn @click="importPreviews('preview_b64')">Import Preview files</Btn>
            <Btn @click="importPreviews('booklet_b64')">Import Booklet files</Btn>
            <p>
                Collection: <select v-model="collection">
                    <option value="">None</option>
                    <option value="ducks_everywhere">Ducks Everywhere</option>
                </select>
            </p>
            <table>
                <tr><th>file</th><th>Name</th><th>ID</th><th>NB briqs</th><th>Preview</th><th>Server Preview</th><th>Booklet ID</th><th>Booklet</th><th>Server Booklet</th><th>AGID</th><th>AID</th></tr>
                <tr v-for="setToMint, i in setsToMint" :key="i">
                    <td>{{ setToMint._data?.filename }}</td>
                    <td>{{ setToMint._data?.data.name }}</td>
                    <td>{{ setToMint._data?.data.id }}</td>
                    <td>{{ setToMint._data?.data.getNbBriqs() }}</td>
                    <td><img class="w-16" v-if="setToMint._data?.preview_b64" :src="setToMint._data?.preview_b64"></td>
                    <td><img v-if="setToMint._data?.data.id" :src="backendManager.getPreviewUrl(setToMint._data?.data.id)"><p v-else>false</p></td>
                    <td>{{ collection ? `${collection}/${setToMint._data?.data.name}`: 'N/A' }}</td>
                    <td><img class="w-16" v-if="collection && setToMint._data?.booklet_b64" :src="setToMint._data?.booklet_b64"></td>
                    <td>{{ collection ? 'TODO' : '' }}</td>
                    <td>{{ assemblyGroupId }}</td>
                    <td/>
                </tr>
            </table>
            <Btn @click="storeObjects">Store object metadata</Btn>
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
            <table>
                <tr><th>Object ID</th><th>Booklet metadata</th><th>Name</th><th>Serial #</th><th>Token ID</th></tr>
                <tr v-for="id in existingItems?.[collection] ?? []" :key="id">
                    <td>{{ id }}</td>
                    <template v-if="id in bookletDataStore[getCurrentNetwork()] && bookletDataStore[getCurrentNetwork()][id]._data">
                        <td>
                            <Btn
                                secondary
                                @click="() => pushModal(TextModal, {
                                    text: JSON.stringify(bookletDataStore[getCurrentNetwork()][id]._data, null, 4)
                                })">
                                Show metadata
                            </Btn>
                        </td>
                        <td>
                            {{ bookletDataStore[getCurrentNetwork()][id]._data.name }}
                        </td>
                        <td>
                            {{ bookletDataStore[getCurrentNetwork()][id]._data.serial_number }}
                        </td>
                        <td>
                            {{ bookletDataStore[getCurrentNetwork()][id]._data.token_id }}
                        </td>
                    </template>
                    <td v-else-if="id in bookletDataStore[getCurrentNetwork()]">
                        {{ bookletDataStore[getCurrentNetwork()][id]._status }}
                    </td>
                    <td v-else>
                        <Btn no-background @click="() => bookletDataStore[getCurrentNetwork()][id]">
                            Load
                        </Btn>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <Footer/>
</template>