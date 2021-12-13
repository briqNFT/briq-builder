<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Export set</h2>
            <p>Set {{ metadata.set }}</p>
            <p>Name: {{ set.name }}</p>
            <p>Briqs: {{ set.briqsDB.briqs.size }}</p>
            <p v-if="pending_transaction">Pending transaction: {{ pending_transaction }}</p>
            <div class="flex justify-around my-8">
                <div class="flex flex-col justify-center">
                    <p><button class="block mx-auto btn" @click="exportSetLocally">Export locally</button></p>
                    <p>Download a local copy of your set</p>
                </div>
                <div class="flex flex-col justify-center">
                    <p><button class="block mx-auto btn" :disabled="exporting || pending_transaction" @click="exportSet">Export on chain</button></p>
                    <p>Assemble briqs into a set on the blockchain</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
            pending_transaction: undefined,
            exporting: false,
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages"],
    mounted() {
        this.name = this.set.name;
    },
    computed: {
        set: function() {
            return this.$store.state.builderData.wipSets.filter(x => x.id === this.metadata.set)?.[0];
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
                exportSet.swapForRealBriqs(this.$store.state.builderData.briqsDB);
                data = exportSet.serialize();
                await fetchData("store_set", { token_id: data.id, data: data });
                let TX = await this.$store.state.builderData.setContract.mint(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => "" + x.data.briq));
                console.log(TX);
                this.messages.pushMessage("Set exported - TX " + TX.transaction_hash);
                this.pending_transaction = TX.transaction_hash;
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