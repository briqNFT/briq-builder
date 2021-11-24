<template>
    <div :class="asModal ? 'w-full h-full p-24 invisible absolute top-0' : 'w-full min-h-screen h-full bg-briq-light'">
        <div :class="'visible px-4 py-2 ' + (asModal ? 'rounded-md shadow-xl w-full h-full bg-briq-light' : 'container mx-auto')">
            <button v-if="asModal" class="float-right text-4xl text-gray-700" @click="$emit('close')">X</button>
            <h1 class="text-center my-8">Browse sets</h1>
            <div class="my-4">
                <p><input class="w-full" type="text" placeholder="Type to search"/></p>
            </div>
            <div class="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div v-for="setId in chainSets" class="w-full h-40 bg-briq rounded-md p-4" :key="setId">
                    <h4 class="text-center">{{setId}}</h4>
                    <button class="btn bg-briq-light" @click="disassemble(setId)">Disassemble</button>
                </div>
                <div v-for="i in 10" class="w-full h-40 bg-briq rounded-md p-4" :key="i">
                    <h4 class="text-center">Test Item</h4>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { fetchData } from '../../../url'

import { defineComponent } from 'vue';
export default defineComponent({
    props: ["asModal"],
    emits: ["close"],
    inject: ["messages"],
    computed: {
        chainSets: function() {
            return this.$store.state.builderData.chainSets
        }
    },
    methods: {
        disassemble: async function(sid) {
            try {
                let data = (await fetchData("store_get/" + parseInt(sid, 16))).data;
                let TX = await this.$store.state.builderData.setContract.disassemble(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => "" + x.data.briq));
                this.messages.pushMessage("Disassembly transaction sent - Hash " + TX.transaction_hash);   
            }
            catch(err)
            {
                this.messages.pushMessage("Error while disassembling set - See console for details.");   
                console.error(err);
            }
        }
    }
})
</script>