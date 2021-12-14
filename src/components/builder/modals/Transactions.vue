<template>
    <div class="md:w-3/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Transactions</h3>
            <p v-for="tx in transactionsManager.transactions">{{ tx.hash }} - {{ tx.status }} <Button @click="tx.poll()">Poll</Button></p>
        </div>
    </div>
</template>

<script lang="ts">
import { transactionsManager } from '../../../builder/Transactions';

import { defineComponent } from 'vue';
import Button from '../../generic/Button.vue';
export default defineComponent({
    data() {
        return {
            transactionsManager
        };
    },
    props: ["metadata"],
    emits: ["close"],
    components: { Button }
})
</script>