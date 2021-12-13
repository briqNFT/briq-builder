<script setup lang="ts">
import Button from '../../generic/Button.vue';
</script>

<template>
    <div v-if="!isFiltered" class="w-full bg-briq-dark rounded-md p-4">
        <h4 class="text-center">{{ setData?.name ?? setId}}</h4>
        <div class="flex flex-col gap-2 text-sm">
            <Button tooltip="Delete the set, the briqs can then be reused." class="bg-transparent" :disabled="!setData" @click="disassemble">Disassemble</Button>
            <Button tooltip="Import the set as a WIP set, it can then be modified." class="bg-transparent" :disabled="!canImport" @click="importSet">{{ importBtnText }}</Button>
            <Button tooltip="Transfer the set." class="bg-transparent" :disabled="!setData" @click="transferSet">Transfer</Button>
        </div>
    </div>
</template>

<script lang="ts">
import { fetchData } from '../../../url'

import { setModal, setModalAndAwait } from '../../MiddleModal.vue'

import TransferSet from '../modals/TransferSet.vue'

import { defineComponent } from "@vue/runtime-core"
export default defineComponent({
    data() {
        return {
            setData: undefined,
            setDataQuery: undefined as undefined | Promise<any>,
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
        }
    },
    methods: {
        loadData: async function() {
            if (!this.setData)
            {
                if (!this.setDataQuery)
                    this.setDataQuery = fetchData("store_get/" + parseInt(this.setId, 16));
                this.setData = (await this.setDataQuery!).data;
            }
            return this.setData;
        },
        disassemble: async function() {
            try {
                let data = await this.loadData();
                let TX = await this.$store.state.builderData.setContract.disassemble(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => "" + x.data.briq));
                this.messages.pushMessage("Disassembly transaction sent - Hash " + TX.transaction_hash);   
            }
            catch(err)
            {
                this.messages.pushMessage("Error while disassembling set - See console for details.");   
                console.error(err);
            }
        },
        importSet: async function() {
            try {
                let data = await this.loadData();
                this.$store.dispatch("builderData/create_wip_set", data);
                this.messages.pushMessage("Set loaded");
            }
            catch(err)
            {
                this.messages.pushMessage("Error while loading set - See console for details.");   
                console.error(err);
            }
        },
        async transferSet()
        {
            await setModalAndAwait(TransferSet, { setId: this.setId, data: this.setData });
            setModal();
        }
    }
})
</script>