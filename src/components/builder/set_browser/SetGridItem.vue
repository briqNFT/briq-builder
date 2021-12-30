<script setup lang="ts">
import Button from '../../generic/Button.vue';
</script>

<template>
    <div v-if="!isFiltered" class="w-full bg-briq-dark rounded-md px-4 py-2">
        <h3 class="text-center my-1">{{ setData?.name ?? setId}}
            <i v-if="!setData" class="fas fa-spinner animate-spin-slow"></i>
        </h3>
        <div class="my-2 flex flex-col gap-2 text-sm">
            <Button tooltip="Copy the sharing link for this set." class="bg-transparent" :disabled="disableButtons || !setData" @click="copyShareLink">Copy Sharing Link</Button>
            <Button tooltip="Delete the set, the briqs can then be reused." class="bg-transparent" :disabled="disableButtons || !setData" @click="disassemble">Disassemble</Button>
            <Button tooltip="Import the set as a WIP set, it can then be modified." class="bg-transparent" :disabled="disableButtons || !canImport" @click="importSet">{{ importBtnText }}</Button>
            <Button tooltip="Transfer the set." class="bg-transparent" :disabled="disableButtons || !setData" @click="transferSet">Transfer</Button>
        </div>
    </div>
</template>

<script lang="ts">
import { fetchData } from '../../../url'

import { setModal, setModalAndAwait } from '../../MiddleModal.vue'

import TransferSet from '../modals/TransferSet.vue'

import { Transaction, transactionsManager } from '../../../builder/Transactions'

import contractStore from '../../../Contracts'

import { defineComponent } from "@vue/runtime-core"
export default defineComponent({
    data() {
        return {
            setData: undefined,
            setDataQuery: undefined as undefined | Promise<any>,
            disableButtons: false
        }
    },
    inject: ["messages"],
    props: ["setId", "searchText"],
    mounted() {
        this.loadData();
    },
    computed: {
        /** @return true if the item should be hidden */
        isFiltered: function() {
            // Hide sets that we know are being disassembled
            if (this.inDisassembly)
                return true;

            if (!this.searchText.length)
                return false;
            let text = (this.searchText as string).toLowerCase();
            return this.setId.indexOf(text) === -1 && (this.setData?.name?.toLowerCase()?.indexOf(text) ?? -1) === -1;
        },

        canImport() {
            if (!this.setData)
                return false;
            return !this.$store.state.builderData.wipSets.find(x => x.id == this.setData.id);
        },
        importBtnText() {
            if (this.$store.state.builderData.wipSets.find(x => x.id === this?.setData?.id))
                return "Already imported";
            return "Import";
        },

        inDisassembly() {
            return transactionsManager.get("disassembly").filter(x => x.isOk() && x?.metadata?.setId === this.setId).length;
        },

        inTransfer() {
            return transactionsManager.get("transfer_out").filter(x => x.isOk() && x?.metadata?.setId === this.setId).length;
        }
    },
    methods: {
        loadData: async function() {
            if (!this.setData)
            {
                if (!this.setDataQuery)
                    this.setDataQuery = fetchData("store_get/" + this.setId);
                this.setData = (await this.setDataQuery!).data;
            }
            return this.setData;
        },
        copyShareLink() {
            let network = this.$store.state.wallet.baseUrl.indexOf("mainnet") !== -1 ? "mainnet" : "testnet";
            navigator.clipboard.writeText(`https://briq.construction/share?set_id=${this.setId}&network=${network}&version=1`);
            this.messages.pushMessage("Copied sharing link to clipboard");
        },
        disassemble: async function() {
            try {
                this.disableButtons = true;
                let data = (await this.loadData())!;
                let TX = await contractStore.set.disassemble(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => x.data.briq));
                new Transaction(TX.transaction_hash, 'disassembly', { setId: data.id });
                this.messages.pushMessage("Disassembly transaction sent - Hash " + TX.transaction_hash);   
            }
            catch(err)
            {
                this.messages.pushMessage("Error while disassembling set - See console for details.");   
                console.error(err);
            }
            this.disableButtons = false;
        },
        importSet: async function() {
            try {
                this.disableButtons = true;
                let data = await this.loadData();
                this.$store.dispatch("builderData/create_wip_set", data);
                this.messages.pushMessage("Set loaded");
            }
            catch(err)
            {
                this.messages.pushMessage("Error while loading set - See console for details.");   
                console.error(err);
            }
            this.disableButtons = false;
        },
        async transferSet()
        {
            this.disableButtons = true;
            await setModalAndAwait(TransferSet, { setId: this.setId, data: this.setData });
            setModal();
            this.disableButtons = false;
        }
    }
})
</script>