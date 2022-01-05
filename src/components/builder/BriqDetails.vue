<template>
    <div class="px-4 py-2 text-right">
        <h3 class="w-full">Briq details</h3>
        <p>Total briqs owned: {{ briqsDB.briqs.size }} 
            <button :disabled="data.fetchingBriqs" @click="$store.dispatch('builderData/get_briqs')">
                <i :class="'fas ' + (data.fetchingBriqs ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
            </button>
        </p>
        <p>Total sets owned: {{ chainSets.length }} 
            <button :disabled="fetchingSets" @click="updateChainContracts">
                <i :class="'fas ' + (fetchingSets ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
            </button>
        </p>
    </div>
</template>

<script lang="ts">
import { setsManager } from '../../builder/SetsManager';
import contractStore from '../../Contracts';

import { defineComponent } from 'vue';
import { reportError } from '../../Monitoring';
export default defineComponent({
    data() {
        return {
            data: this.$store.state.builderData,
            briqsDB: this.$store.state.builderData.briqsDB,
        };
    },
    inject: ['messages'],
    computed: {
        chainSets() {
            return setsManager.setList.map(x => setsManager.setsInfo[x]).filter(x => x.status !== 'LOCAL');
        },
        fetchingSets() {
            return setsManager.fetchingChainSets;
        }
    },
    methods: {
        updateChainContracts() {
            if (!contractStore.set)
            {
                this.messages.pushMessage("Cannot update sets - the Dapp is not connected to the contract");
                reportError(new Error("Cannot update sets - the Dapp is not connected to the contract"));
                return;
            }
            setsManager.loadOnChain(contractStore.set, this.$store.state.wallet.userWalletAddress);
        }
    }
})
</script>