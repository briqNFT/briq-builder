<template>
    <div class="md:w-3/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Transactions</h3>
            <p v-for="tx in txs">{{ tx.hash }} - {{ tx.status }}
            <Btn @click="tx.poll()">Poll</Btn>
            <Btn @click="tx.delete()">X</Btn>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import { transactionsManager } from '../../../builder/Transactions';

import { defineComponent } from 'vue';
import Button from '../../generic/Button.vue';
export default defineComponent({
    data() {
    },
    computed: {
        txs() {
            let txs = transactionsManager.transactions.slice();
            console.log("TXS", txs);
            txs = txs.sort((a, b) => a?.metadata?.timestamp - b?.metadata?.timestamp || 0);
            return txs;
        }
    },
    props: ["metadata"],
    emits: ["close"],
    components: { Button }
})
</script>