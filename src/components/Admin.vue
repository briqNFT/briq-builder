<script setup lang="ts">
import { ref, computed } from 'vue';
import { hexUuid } from '@/Uuid';

let _genF = (contract: any, method: string) => {
    // Helper function to asynchronously fetch some data when needed & populate it.
    const v = ref('');
    const getV = computed(() => {
        if (contract?.getAddress())
    // eslint-disable-next-line vue/no-async-in-computed-properties
            callContract(getProvider(), contract.getAddress(), method, []).then(
                (rep) => (v.value = rep.result[0]),
            );
        return v.value;
    })
    return getV;
}

const newSetBriqAddr = ref('');
const getSetBriqAddr = _genF(contractStore.set, 'getBriqAddress_');
const getSetAdmin = _genF(contractStore.set, 'getAdmin_');

const newBriqSetAddr = ref('');
const getBriqSetAddr = _genF(contractStore.briq, 'getSetAddress_');
const getBriqAdmin = _genF(contractStore.briq, 'getAdmin_');


const canMasterInit = computed(() => {
    return contractStore.briq?.getAddress() && contractStore.set?.getAddress() && walletStore.userWalletAddress
});

const masterInit = async () => {
    const payload = [
    // Step 1: set the briq/set address in each respective contract.
        {
            contractAddress: contractStore.briq.getAddress(),
            entrypoint: 'setSetAddress_',
            calldata: [contractStore.set.getAddress()],
        },
        {
            contractAddress: contractStore.set.getAddress(),
            entrypoint: 'setBriqAddress_',
            calldata: [contractStore.briq.getAddress()],
        },
    // Step 2: mint some briqs for the admin
        contractStore.briq?.contract.populate('mintFT', [walletStore.userWalletAddress, '1', '250']),
        contractStore.briq?.contract.populate('mintFT', [walletStore.userWalletAddress, '2', '40']),
        contractStore.briq?.contract.populate('mintFT', [walletStore.userWalletAddress, '3', '50']),
        contractStore.briq?.contract.populate('mintFT', [walletStore.userWalletAddress, '4', '20']),
        contractStore.briq?.contract.populate('mintOneNFT', [walletStore.userWalletAddress, '6', starknet.number.toBN(hexUuid())]),
    ];
    console.log(payload);
    await (walletStore.signer as AccountInterface).execute(payload);
};
</script>

<template>
    <div class="alternate-buttons container px-8 py-4 m-auto main">
        <h1 class="text-center">Admin</h1>
        <div class="grid grid-cols-3">
            <div class="col-span-2">
                <div>
                    <h2>Minting</h2>
                    <label><p><input v-model="address" type="text" size="70"> recipient</p></label>
                    <label><p><input v-model="qty" type="number"> quantity</p></label>
                    <label><p>
                        <select v-model="material">
                            <option value="1">Normal</option>
                            <option value="2">Realms</option>
                        </select>
                        Material
                    </p></label>
                    <Btn @click="mint(address, qty, material)">Mint</Btn>
                </div>
                <div>
                    <h2>Contract setup</h2>
                    <Btn @click="masterInit" :disabled="!canMasterInit">Master init program</Btn>
                    <h3 class="font-mono">Briq</h3>
                    <p>Proxy: {{ contractStore.briq?.getAddress() }}</p>
                    <p>Admin: {{ getBriqAdmin }}</p>
                    <p>Implementation: {{ getBriqImpl }}</p>
                    <p>Set address: {{ getBriqSetAddr }}</p>
                    <p>
                        <input v-model="newBriqImpl" type="text" class="mr-2">
                        <Btn @click="setImpl(contractStore.briq, newBriqImpl)">Upgrade implementation for briq</Btn>
                    </p>
                    <p>
                        <input v-model="newBriqSetAddr" type="text" class="mr-2">
                        <Btn @click="invoke(contractStore.briq, 'setSetAddress_', newBriqSetAddr)">Change set address for briq</Btn>
                    </p>
                    <h3 class="font-mono">Set</h3>
                    <p>Proxy: {{ contractStore.set?.getAddress() }}</p>
                    <p>Admin: {{ getSetAdmin }}</p>
                    <p>Implementation: {{ getSetImpl }}</p>
                    <p>Briq address: {{ getSetBriqAddr }}</p>
                    <p>
                        <input v-model="newSetImpl" type="text" class="mr-2">
                        <Btn @click="setImpl(contractStore.set, newSetImpl)">Upgrade implementation for set</Btn>
                    </p>
                    <p>
                        <input v-model="newSetBriqAddr" type="text" class="mr-2">
                        <Btn @click="invoke(contractStore.set, 'setBriqAddress_', newSetBriqAddr)">Change briq address for set</Btn>
                    </p>
                </div>
                <div class="my-4">
                    <h2>Custom Write Call:</h2>
                    <p>
                        <select v-model="cc_contract">
                            <option value="set">set</option>
                            <option value="briq">briq</option>
                            <option value="booklet">booklet</option>
                            <option value="box">box</option>
                            <option value="auction">auction</option>
                        </select>
                    </p>
                    <p>Function: <input type="text" v-model="selector"></p>
                    <p>Calldata (csv): <input type="text" v-model="calldata"></p>
                    <p>
                        <Btn :disabled="cc_pending" @click="customCall">Call</Btn><i v-if="cc_pending" class="far fa-spinner animate-spin"/>
                    </p>
                    <p v-if="customResult">Result: {{ JSON.stringify(customResult) }}</p>
                </div>
            </div>
            <div class="border-l-4 border-grad-darker mr-4">
                <div>
                    <h2>Wallet</h2>
                    <p>Current address: {{ wallet.user_id }}</p>
                    <Btn @click="wallet.disconnect(); wallet.openWalletSelector();">Connect Wallet</Btn>
                </div>
                <div>
                    <h2>Messages</h2>
                    <p class="break-all" v-for="(mess, i) in messages" :key="i">{{ mess }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
h2 {
    @apply border-t-4 border-grad-darker mb-4;
}
.main > div {
    @apply my-4;
}
</style>

<script lang="ts">
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { messagesStore, pushMessage } from '../Messages';
import type { AccountInterface, Provider, Signer } from 'starknet';
import { hash as snHash } from 'starknet';
import * as starknet from 'starknet';

import { getProvider } from '@/chain/Provider';
import { walletStore } from '@/chain/Wallet';

const callContract = function (provider: Provider, address: string, entryPoint: string, data: any[]) {
    /*if (!provider.estimateFee)
        return provider.callContract({
            contract_address: address,
            entry_point_selector: getSelectorFromName(entryPoint),
            calldata: data
        })
    */
    return provider.callContract({
        contractAddress: address,
        calldata: data,
        entrypoint: entryPoint,
    });
};

import { defineComponent } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
export default defineComponent({
    data() {
        return {
            address: '',
            qty: 0,
            material: 1,

            _setImpl: '',
            _briqImpl: '',

            newSetImpl: '',
            newBriqImpl: '',

            cc_contract: 'set',
            selector: '',
            calldata: '',
            customResult: '',
            cc_pending: false,
        };
    },
    computed: {
        wallet() {
            return walletStore;
        },
        contractStore() {
            return contractStore;
        },
        messages() {
            return messagesStore.messages;
        },
        getSetImpl() {
            if (contractStore?.set?.getAddress())
                callContract(getProvider(), contractStore.set.getAddress(), 'getImplementation_', []).then(
                    (rep) => (this._setImpl = rep.result[0]),
                );
            return this._setImpl;
        },
        getBriqImpl() {
            if (contractStore?.briq?.getAddress())
                callContract(getProvider(), contractStore.briq.getAddress(), 'getImplementation_', []).then(
                    (rep) => (this._briqImpl = rep.result[0]),
                );
            return this._briqImpl;
        },
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number, material: string) {
            if (!address) {
                pushMessage('No address');
                return;
            }
            pushMessage(
                JSON.stringify(await contractStore.briq?.mintFT(address, material, qty)) ??
                    'Failed to mint, contract is unset',
            );
        },
        async setImpl(contract: any, address: string) {
            if (walletStore?.signer?.signer) {
                let tx = await (walletStore.signer as AccountInterface).execute({
                    contractAddress: contract.getAddress(),
                    entrypoint: 'upgradeImplementation_',
                    calldata: [address],
                });
                pushMessage(JSON.stringify(tx));
            } else {
                let tx = await (walletStore.signer as Signer).invokeFunction(
                    starknet.number.toBN(contract.getAddress()).toString(),
                    starknet.number.toBN(snHash.getSelectorFromName('upgradeImplementation_')).toString(),
                    [starknet.number.toBN(address).toString()],
                );
                pushMessage(JSON.stringify(tx));
            }
        },
        async invoke(contract: any, method: string, ...args: string[]) {
            let tx = await (walletStore.signer as AccountInterface).execute({
                contractAddress: contract.getAddress(),
                entrypoint: method,
                calldata: args,
            });
            pushMessage(JSON.stringify(tx));
        },

        async customCall() {
            this.cc_pending = true;
            try {
                this.customResult = '';

                if (walletStore?.signer?.signer) {
                    let tx = await (walletStore.signer as AccountInterface).execute({
                        contractAddress: ADDRESSES[getCurrentNetwork()][this.cc_contract],
                        entrypoint: this.selector,
                        calldata: this.calldata
                            .split(',')
                            .filter((x) => x)
                            .map((x: string) => starknet.number.toBN(x.trim()).toString()),
                    });
                    pushMessage(JSON.stringify(tx));
                } else {
                    let tx = await (walletStore.signer as Signer).invokeFunction(
                        starknet.number.toBN(ADDRESSES[getCurrentNetwork()][this.cc_contract]).toString(),
                        starknet.number.toBN(snHash.getSelectorFromName(this.selector)).toString(),
                        this.calldata
                            .split(',')
                            .filter((x) => x)
                            .map((x: string) => starknet.number.toBN(x.trim()).toString()),
                    );
                    pushMessage(JSON.stringify(tx));
                }
                this.customResult = `${tx.code} ${tx.transaction_hash}`;
            } catch (err) {
                this.customResult = err.toString();
            }
            this.cc_pending = false;
        },
    },
});
</script>
