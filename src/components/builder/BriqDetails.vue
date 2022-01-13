<template>
    <div class="px-4 py-2 text-right">
        <h3 class="w-full">Briq details</h3>
        <p>Total briqs owned: {{ balance }} 
            <button :disabled="fetchingBriqs" @click="getBalance(); $store.dispatch('builderData/try_fetching_user_data')">
                <i :class="'fas ' + (fetchingBriqs ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
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
import { reportError } from '../../Monitoring';
import { ticketing } from '../../Async';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    data() {
        return {
            data: this.$store.state.builderData,
            briqsDB: this.$store.state.builderData.briqsDB,
            balance: undefined as undefined | number,
        };
    },
    beforeMount() {
        watchEffect(() => {
            this.getBalance();
        })
    },
    inject: ['messages'],
    computed: {
        chainSets() {
            return setsManager.setList.map(x => setsManager.setsInfo[x]).filter(x => x.status !== 'LOCAL');
        },
        fetchingSets() {
            return setsManager.fetchingChainSets;
        },
        fetchingBriqs() {
            return this.balance === undefined;
        }
    },
    methods: {
        getBalance: ticketing(async function(this: any) {
            this.balance = undefined;
            this.balance = parseInt(await contractStore.briq?.balance_of(this.$store.state.wallet.userWalletAddress), 16) || 0;
        }),
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