<template>
    <div class="px-4 py-2 text-right">
        <h3 class="w-full">Briq details</h3>
        <p>Total briqs owned: {{ briqsDB.briqs.size }} 
            <button :disabled="data.fetchingBriqs" @click="$store.dispatch('builderData/get_briqs')">
                <i :class="'fas ' + (data.fetchingBriqs ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
            </button>
        </p>
        <p>Total sets owned: {{ data.chainSets.length }} 
            <button :disabled="data.fetchingSets" @click="$store.dispatch('builderData/get_chain_sets')">
                <i :class="'fas ' + (data.fetchingSets ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
            </button>
        </p>
    </div>
</template>

<script lang="ts">
import { transactionsManager } from '../../builder/Transactions';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            data: this.$store.state.builderData,
            briqsDB: this.$store.state.builderData.briqsDB,
        };
    },
    inject: ['messages'],
    methods: {
    }
})
</script>