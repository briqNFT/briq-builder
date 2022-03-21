<script setup lang="ts">
</script>

<template>
    <div class="alternate-buttons container px-8 py-4 m-auto">
        <h1 class="text-center">Admin</h1>
        <div class="h-40 max-h-40 overflow-auto">
            <h3>Messages</h3>
            <p class="break-all" v-for="mess in messages">{{ mess }}</p>
        </div>
        <div>
            <h3>Minting</h3>
            <label><p><input v-model="address" type="text"/> recipient</p></label>
            <label><p><input v-model="qty" type="number"/> quantity</p></label>
            <Btn @click="mint(address, qty)">Mint</Btn>
        </div>
        <div>
            <h3>Contract initialisation</h3>
            <p class="font-mono">Set proxy : {{ contractStore.set?.getAddress() }} -> {{ getSetImpl }}</p>
            <p><input v-model="newSetImpl" type="text"> <Btn @click="setImpl(contractStore.set, newSetImpl)">Set new implementation</Btn></p>
            <p class="font-mono">Briq proxy: {{ contractStore.briq?.getAddress() }} -> {{ getBriqImpl }}</p>
            <p><input v-model="newBriqImpl" type="text"> <Btn @click="setImpl(contractStore.briq, newBriqImpl)">Set new implementation</Btn></p>

        </div>
    </div>
</template>

<script lang="ts">
import contractStore from '@/chain/Contracts';
import { messagesStore, pushMessage } from '../Messages'
import { defineComponent } from 'vue';
import type { AccountInterface, Provider, Signer } from 'starknet';
import { getSelectorFromName } from 'starknet/utils/hash';
import { store } from '@/store/Store';
import { toBN } from 'starknet/utils/number';

const callContract = function(provider: Provider, address: string, entryPoint: string, data: any[])
{
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
    })
}


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
            if (contractStore?.set?.getAddress())
                callContract(this.$store.state.wallet.provider, contractStore.set.getAddress(), "getImplementation", []).then(rep => this._setImpl = rep.result[0]);
            return this._setImpl;
        },
        getBriqImpl() {
            if (contractStore?.briq?.getAddress())
                callContract(this.$store.state.wallet.provider, contractStore.briq.getAddress(), "getImplementation", []).then(rep => this._briqImpl = rep.result[0]);
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
            if (this.$store.state.wallet.signer.signer)
            {
                (this.$store.state.wallet.signer as AccountInterface).execute({
                    contractAddress: contract.getAddress(),
                    entrypoint: "setImplementation",
                    calldata: []
                });
            }
            else
            {
                let tx = await (this.$store.state.wallet.signer as Signer).invokeFunction(
                    toBN(contract.getAddress()).toString(),
                    toBN(getSelectorFromName("setImplementation")).toString(),
                    [toBN(address).toString()]
                );
                pushMessage(JSON.stringify(tx));
            }
        }
    }
})
</script>