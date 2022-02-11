<template>
    <div class="px-4 py-2" v-if="txs.length">
        <h3 class="text-center w-full">Transactions</h3>
        <p class="text-center text-xs leading-3 m-0 p-0">newest on top</p>
        <p class="text-right" v-for="tx in txs">
        <span class="text-sm cursor-pointer" @click="copyHash(tx)">{{ tx.hash.substr(0, 7) + '...' + tx.hash.substr(59) }}</span> - {{ tx.status }}
        <span class=" text-sm">
            <Btn :noStyle="true" class="mx-1" @click="tx.poll()"><i :class="'fas fa-sync ' + (tx.refreshing ? 'animate-spin' : '')"></i></Btn>
            <Btn :noStyle="true" class="mx-1" @click="tx.delete()"><i class="far fa-trash-alt"></i></Btn>
        </span>
        </p>
    </div>
</template>

<script lang="ts">
import { transactionsManager } from '../../builder/Transactions';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            transactionsManager
        };
    },
    inject: ['messages'],
    computed: {
        txs() {
            let txs = transactionsManager.transactions.slice();
            txs = txs.sort((a, b) => b?.metadata?.timestamp - a?.metadata?.timestamp || 0);
            return txs;
        }
    },
    methods: {
        copyHash(tx) {
            navigator.clipboard.writeText(tx.hash);
            this.messages.pushMessage("Transaction hash copied to clipboard");
        }
    }
})
</script>