<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Export set</h2>
            <p>Set: {{ metadata.set }}</p>
            <p>Name: {{ set.name }}</p>
            <template v-if="briqsForExport.length">
                <h4 class="font-semibold">Briqs</h4>
                <div class="max-h-40 overflow-auto">
                    <BriqTable :briqs="briqsForExport" :columns="['color', 'material']">
                    </BriqTable>
                </div>
            </template>
            <p v-if="transactionPending">Pending transaction: {{ pending_transaction.hash }}</p>
            <div class="flex justify-around my-8">
                <div class="flex flex-col justify-start basis-1/2 text-center">
                    <p><button class="block mx-auto btn" @click="exportSetLocally">Export locally</button></p>
                    <p>Download a local copy of your set</p>
                </div>
                <div class="flex flex-col justify-start basis-1/2 text-center">
                    <p><button class="block mx-auto btn" :disabled="exporting || transactionPending || alreadyOnChain || !hasBriqsAndSets || notEnoughBriqs"
                        @click="exportSetOnChain">Export on chain</button></p>
                    <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                    <p v-else-if="exporting || transactionPending">...Export is ongoing...</p>
                    <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                    <p v-else-if="!hasBriqsAndSets">Briqs need to be loaded before you can export a set. Please wait a little while.</p>
                    <p v-else="">Assemble briqs into a set on the blockchain</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';
import type { Briq, BriqsDB } from '../../../builder/BriqsDB';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import contractStore from '../../../Contracts';

import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
            pending_transaction: undefined as Transaction | undefined,
            exporting: false,
            briqsForExport: [] as Array<Briq>,
            exportSet: undefined as SetData | undefined,
        };
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages", "reportError"],
    async mounted() {
        this.name = this.set.name;
        this.pending_transaction = transactionsManager.get("export_set").filter(x => x.isOk() && x?.metadata?.setId === this.metadata.set)?.[0];
        await this.prepareForExport();
    },
    computed: {
        setInfo() {
            return setsManager.setsInfo[this.metadata.set];
        },
        set() {
            return this.setInfo.local!;
        },
        alreadyOnChain() {
            return this.setInfo.status !== 'LOCAL' || this.pending_transaction?.isOnChain();
        },
        transactionPending() {
            return this.pending_transaction?.isPending() ?? false;
        },
        hasBriqsAndSets() {
            return this.$store.state.builderData.briqsDB.briqs.size;
        },
        notEnoughBriqs() {
            // if there is no exportable set, then we have some briq-related issue.
            return !this.exportSet;
        },
    },
    methods: {
        exportSetLocally: function () {
            downloadJSON(this.set.serialize(), this.set.id + ".json");
        },
        exportSetOnChain: async function () {
            if (!contractStore.set)
                return;
            this.exporting = true;
            try {
                await this.prepareForExport();
                if (!this.exportSet)
                    throw new Error("The set could not be exported");
                let data = this.exportSet.serialize();
                await fetchData("store_set", { token_id: data.id, data: data });
                // Debug
                //downloadJSON(data, data.id + ".json")
                let TX = await contractStore.set.mint(this.$store.state.wallet.userWalletAddress, data.id, data.briqs.map(x => x.data.briq));
                new Transaction(TX.transaction_hash, "export_set", { setId: data.id });
                this.messages.pushMessage("Set exported " + data.id + " - TX " + TX.transaction_hash);
                this.pending_transaction = transactionsManager.getTx(TX.transaction_hash);
                this.$store.dispatch("builderData/update_set", data);
            }
            catch (err) {
                this.messages.pushMessage("Error while exporting set - check console for details");
                this.reportError(err);
                console.error(err);
            }
            this.exporting = false;
        },
        async prepareForExport() {
            if (this.exportSet)
                return;
            let data = this.set.serialize();
            const chainBriqs: BriqsDB = this.$store.state.builderData.briqsDB;
            let exportSet = new SetData(data.id);
            exportSet.deserialize(data);
            let userCustom = [];
            exportSet.forEach((briq: Briq) => {
                if (chainBriqs.briqs.has(briq.id))
                    userCustom.push(briq.id);
            });
            try {
                exportSet.swapForRealBriqs(chainBriqs);
            }
            catch (err) {
                this.briqsForExport = [];
                this.exportSet = undefined;
                return;
            }
            this.briqsForExport = Array.from(exportSet.briqsDB.briqs.values());
            this.exportSet = exportSet;
        }
    },
    components: { BriqTable }
})
</script>
