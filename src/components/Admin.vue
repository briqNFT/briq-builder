<script setup lang="ts">
</script>

<template>
    <div class="alternate-buttons container px-8 py-4 m-auto main">
        <h1 class="text-center">Admin</h1>
        <div class="h-40 max-h-40 overflow-auto">
            <h3>Messages</h3>
            <p class="break-all" v-for="mess in messages">{{ mess }}</p>
        </div>
        <div>
            <h3>Minting</h3>
            <label><p><input v-model="address" type="text" size="70"/> recipient</p></label>
            <label><p><input v-model="qty" type="number"/> quantity</p></label>
            <label><p><select v-model="material">
                <option value="1">Normal</option>
                <option value="2">Realms</option>
            </select> Material</p></label>
            <Btn @click="mint(address, qty, material)">Mint</Btn>
        </div>
        <div>
            <h3>Realms Minting</h3>
            <p>One address per line.</p>
            <label><p><textarea v-model="address" rows="5" cols="80" /> recipient</p></label>
            <Btn @click="mintRealms(address)">Mint Realms default (20K FT, 1 NFT)</Btn>
        </div>
        <div>
            <h3>Contract initialisation</h3>
            <p class="font-mono">Set proxy : {{ contractStore.set?.getAddress() }} -> {{ getSetImpl }}</p>
            <p><input v-model="newSetImpl" type="text"> <Btn @click="setImpl(contractStore.set, newSetImpl)">Set new implementation</Btn></p>
            <p class="font-mono">Briq proxy: {{ contractStore.briq?.getAddress() }} -> {{ getBriqImpl }}</p>
            <p><input v-model="newBriqImpl" type="text"> <Btn @click="setImpl(contractStore.briq, newBriqImpl)">Set new implementation</Btn></p>
        </div>
        <div class="my-4">
            <h3>Custom Write Call:</h3>
            <p><select v-model="cc_contract"><option value="set">set</option><option value="briq">briq</option></select></p>
            <p>Function: <input type="text" v-model="selector"/></p>
            <p>Calldata (csv): <input type="text" v-model="calldata"/></p>
            <p><Btn :disabled="cc_pending" @click="customCall">Call</Btn><i v-if="cc_pending" class="fas fa-spinner animate-spin"></i></p>
            <p v-if="customResult">Result: {{ JSON.stringify(customResult) }}</p>
        </div>

    </div>
</template>

<style scoped>
    .main > div {
        @apply my-4;
    }
</style>

<script lang="ts">
import contractStore from '@/chain/Contracts';
import { messagesStore, pushMessage } from '../Messages'
import type { AccountInterface, Provider, Signer } from '@/starknet_wrapper';
import { getSelectorFromName } from '@/starknet_wrapper';
import { store } from '@/store/Store';
import { toBN } from '@/starknet_wrapper';

import { getProvider } from '@/chain/Provider';
import { walletStore2 } from '@/chain/Wallet';

import { hexUuid } from '@/Uuid';

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

        import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            address: "",
            qty: 0,
            material: 1,

            _setImpl: "",
            _briqImpl: "",

            newSetImpl: "",
            newBriqImpl: "",

            cc_contract: "set",
            selector: "",
            calldata: "",
            customResult: "",
            cc_pending: false,
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
                callContract(getProvider(), contractStore.set.getAddress(), "getImplementation", []).then(rep => this._setImpl = rep.result[0]);
            return this._setImpl;
        },
        getBriqImpl() {
            if (contractStore?.briq?.getAddress())
                callContract(getProvider(), contractStore.briq.getAddress(), "getImplementation", []).then(rep => this._briqImpl = rep.result[0]);
            return this._briqImpl;
        },
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number, material: string) {
            if (!address)
            {
                pushMessage("No address");
                return;
            }
            pushMessage(JSON.stringify((await contractStore.briq?.mintFT(address, material, qty))) ?? "Failed to mint, contract is unset");
        },
        async mintRealms(address: string) {
            if (!address)
            {
                pushMessage("No address");
                return;
            }
            pushMessage(JSON.stringify(await (walletStore2.signer as AccountInterface).execute(
                address.split("\n").filter(x => x).map(x => [
                    contractStore.briq?.contract.populate("mintFT", [x, "2", "20000"]),
                    contractStore.briq?.contract.populate("mintOneNFT", [x, "2", toBN(hexUuid())])
                ]).flat()
            )));
        },
        async setImpl(contract: any, address: string) {
            if (walletStore2?.signer?.signer)
            {
                let tx = await (walletStore2.signer as AccountInterface).execute({
                    contractAddress: contract.getAddress(),
                    entrypoint: "setImplementation",
                    calldata: [address]
                });
                pushMessage(JSON.stringify(tx));
            }
            else
            {
                let tx = await (walletStore2.signer as Signer).invokeFunction(
                    toBN(contract.getAddress()).toString(),
                    toBN(getSelectorFromName("setImplementation")).toString(),
                    [toBN(address).toString()]
                );
                pushMessage(JSON.stringify(tx));
            }
        },

        async customCall() {
            this.cc_pending = true;
            try {
                this.customResult = "";

                if (walletStore2?.signer?.signer)
                {
                    let tx = await (walletStore2.signer as AccountInterface).execute({
                        contractAddress: (this.cc_contract === "set" ? contractStore.set : contractStore.briq).getAddress(),
                        entrypoint: this.selector,
                        calldata: this.calldata.split(",").filter(x => x).map((x: string) => toBN(x.trim()).toString())
                    });
                    pushMessage(JSON.stringify(tx));
                }
                else
                {
                    let tx = await (walletStore2.signer as Signer).invokeFunction(
                        toBN((this.cc_contract === "set" ? contractStore.set : contractStore.briq).getAddress()).toString(),
                        toBN(getSelectorFromName(this.selector)).toString(),
                        this.calldata.split(",").filter(x => x).map((x: string) => toBN(x.trim()).toString())
                    );
                    pushMessage(JSON.stringify(tx));
                }
                this.customResult = `${tx.code} ${tx.transaction_hash}`;
            } catch(err) {
                this.customResult = err.toString();
            }
            this.cc_pending = false;
        },
    }
})
</script>