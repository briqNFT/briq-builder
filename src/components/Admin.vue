<script setup lang="ts">
</script>

<template>
    <div class="alternate-buttons container px-8 py-4 m-auto">
        <h1 class="text-center">Admin</h1>
        <div class="h-40 max-h-40 overflow-auto">
            <h3>Messages</h3>
            <p v-for="mess in messages">{{ mess }}</p>
        </div>
        <div>
            <h3>Minting</h3>
            <label><p><input v-model="address" type="text"/> recipient</p></label>
            <label><p><input v-model="qty" type="number"/> quantity</p></label>
            <Btn @click="mint(address, qty)">Mint</Btn>
        </div>
        <div>
            <h3>Contract initialisation</h3>
            <p class="font-mono">Set proxy : {{ contractStore.set?.connectedTo }} -> {{ getSetImpl }}</p>
            <p><input v-model="newSetImpl" type="text"> <Btn @click="setImpl(contractStore.set, newSetImpl)">Set new implementation</Btn></p>
            <p class="font-mono">Briq proxy: {{ contractStore.briq?.connectedTo }} -> {{ getBriqImpl }}</p>
            <p><input v-model="newBriqImpl" type="text"> <Btn @click="setImpl(contractStore.briq, newBriqImpl)">Set new implementation</Btn></p>

        </div>
    </div>
</template>

<script lang="ts">
import contractStore from '@/chain/Contracts';
import { messagesStore, pushMessage } from '../Messages'
import { defineComponent } from 'vue';
import type { Provider, Signer } from 'starknet';
import { getSelectorFromName } from 'starknet/utils/stark';

export default defineComponent({
    data() {
        return {
            address: "",
            qty: 0,

            _setImpl: "",
            _briqImpl: "",

            newSetImpl: "",
            newBriqImpl: "",
        }
    },
    computed: {
        contractStore() {
            return contractStore;
        },
        messages() {
            return messagesStore.messages;
        },
        getSetImpl() {
            if (contractStore?.set?.connectedTo)
                (this.$store.state.wallet.provider as Provider).callContract({
                    contract_address: contractStore.set.connectedTo,
                    entry_point_selector: getSelectorFromName("getImplementation"),
                    calldata: []
                }).then(rep => this._setImpl = rep.result[0]);
            return this._setImpl;
        },
        getBriqImpl() {
            if (contractStore?.briq?.connectedTo)
                (this.$store.state.wallet.provider as Provider).callContract({
                    contract_address: contractStore.briq.connectedTo,
                    entry_point_selector: getSelectorFromName("getImplementation"),
                    calldata: []
                }).then(rep => this._briqImpl = rep.result[0]);
            return this._briqImpl;
        },
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number) {
            if (!address)
            {
                pushMessage("No address");
                return;
            }
            pushMessage(JSON.stringify((await contractStore.briq?.mint(address, qty))) ?? "Failed to mint, contract is unset");
        },
        async setImpl(contract: any, address: string) {
            let tx = await (this.$store.state.wallet.signer as Signer).invokeFunction(
                contract.connectedTo,
                getSelectorFromName("setImplementation"),
                [address]
            );
            pushMessage(JSON.stringify(tx));
        }
    }
})
</script>