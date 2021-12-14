<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Export set</h2>
            <p>Set: 0x{{ metadata.set.toString(16) }}</p>
            <p>Name: {{ set.name }}</p>
            <p>Briqs: {{ set.briqsDB.briqs.size }}</p>
            <p v-if="transactionPending">Pending transaction: {{ pending_transaction.hash }}</p>
            <div class="flex justify-around my-8">
                <div class="flex flex-col justify-start basis-1/2 text-center">
                    <p><button class="block mx-auto btn" @click="exportSetLocally">Export locally</button></p>
                    <p>Download a local copy of your set</p>
                </div>
                <div class="flex flex-col justify-start basis-1/2 text-center">
                    <p><button class="block mx-auto btn" :disabled="exporting || transactionPending || alreadyOnChain || !hasBriqsAndSets"
                        @click="exportSet">Export on chain</button></p>
                    <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                    <p v-else-if="exporting || transactionPending">...Export is ongoing...</p>
                    <p v-else-if="!hasBriqsAndSets">Briqs need to be loaded before you can export a set. Please wait a little while.</p>
                    <p v-else="">Assemble briqs into a set on the blockchain</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
            pending_transaction: undefined as Transaction | undefined,
            exporting: false,
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages"],
    mounted() {
        this.name = this.set.name;
        this.pending_transaction = transactionsManager.get("export_set").filter(x => x.isOk() && x?.metadata?.setId === this.metadata.set)?.[0];
    },
    computed: {
        set: function() {
            return this.$store.state.builderData.wipSets.filter(x => x.id === this.metadata.set)?.[0];
        },
        alreadyOnChain() {
            return (!!this.$store.state.builderData.chainSets.find(x => parseInt(x, 16) === this.metadata.set)) || this.pending_transaction?.isOnChain();
        },
        transactionPending() {
            return this.pending_transaction?.isPending() ?? false;
        },
        hasBriqsAndSets() {
            return this.$store.state.builderData.briqsDB.briqs.size
        }
    },
    methods: {
        exportSetLocally: function() {
            downloadJSON(this.$store.state.builderData.currentSet.serialize(), this.$store.state.builderData.currentSet.id + ".json")
        },
        exportSet: async function() {
            if (!this.$store.state.builderData.setContract)
                return;
            this.exporting = true;
            try {
                let data = this.$store.state.builderData.currentSet.serialize();
                let exportSet = new SetData(data.id, this.$store.state.builderData.briqsDB);
                exportSet.deserialize(data);
                exportSet.swapForFakeBriqs();
                exportSet.swapForRealBriqs(this.$store.state.builderData.briqsDB);
                data = exportSet.serialize();
                await fetchData("store_set", { token_id: data.id, data: data });
                let TX = await this.$store.state.builderData.setContract.mint(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => "" + x.data.briq));
                new Transaction(TX.transaction_hash, "export_set", { setId: data.id });
                this.messages.pushMessage("Set exported - TX " + TX.transaction_hash);
                this.pending_transaction = transactionsManager.getTx(TX.transaction_hash);
            }
            catch(err)
            {
                this.messages.pushMessage("Error while exporting set - check console for details");
                console.error(err);
            }
            this.exporting = false;
        }
    }
})
</script>