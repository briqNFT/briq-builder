<script setup lang="ts">
import { ref, computed } from 'vue';
import { hexUuid } from '@/Uuid';

const canMasterInit = computed(() => {
    return contractStore.briq?.getAddress() && contractStore.set?.getAddress() && walletStore.userWalletAddress
});

const impersonate = ref('');
</script>

<template>
    <Header/>
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
                        </select>
                        Material
                    </p></label>
                    <Btn @click="mint(address, qty, material)">Mint</Btn>
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
                            <option value="auction_ducks">auction (ducks)</option>
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
                    <p>Impersonate wallet:<br><input v-model="impersonate" size="64"></p>
                    <Btn @click="wallet.enableExternalWallet(impersonate)" :disabled="!impersonate">Impersonate</Btn>
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
import Header from './landing_page/Header.vue';
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
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number, material: string) {
            if (!address) {
                pushMessage('No address');
                return;
            }
            pushMessage(JSON.stringify(await contractStore.briq?.mintFT(address, material, qty)) ??
                'Failed to mint, contract is unset');
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
                let tx = await (walletStore.signer as Signer).invokeFunction(BigInt(contract.getAddress()).toString(), BigInt(snHash.getSelectorFromName('upgradeImplementation_')).toString(), [BigInt(address).toString()]);
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
                            .map((x: string) => BigInt(x.trim()).toString()),
                    });
                    pushMessage(JSON.stringify(tx));
                } else {
                    let tx = await (walletStore.signer as Signer).invokeFunction(BigInt(ADDRESSES[getCurrentNetwork()][this.cc_contract]).toString(), BigInt(snHash.getSelectorFromName(this.selector)).toString(), this.calldata
                        .split(',')
                        .filter((x) => x)
                        .map((x: string) => BigInt(x.trim()).toString()));
                    pushMessage(JSON.stringify(tx));
                }
                this.customResult = `${tx.code} ${tx.transaction_hash}`;
            } catch (err) {
                this.customResult = err.toString();
            }
            this.cc_pending = false;
        },
    },
    components: { Header },
});
</script>
