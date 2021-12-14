<template>
    <div class="px-4 py-2" v-if="transactionsManager.transactions.length">
        <h3 class="text-center w-full">Transactions</h3>
        <p class="text-right" v-for="tx in transactionsManager.transactions">
        <span class="text-sm" @click="copyHash(tx)">{{ tx.hash.substr(0, 7) + '...' + tx.hash.substr(59) }}</span> - {{ tx.status }}
        <span class=" text-sm">
            <Button :noStyle="true" class="mx-1" @click="tx.poll()"><i :class="'fas fa-sync ' + (tx.refreshing ? 'animate-spin' : '')"></i></Button>
            <Button :noStyle="true" class="mx-1" @click="tx.delete()"><i class="far fa-trash-alt"></i></Button>
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
    methods: {
        copyHash(tx) {
            navigator.clipboard.writeText(tx.hash);
        }
    }
})
</script>