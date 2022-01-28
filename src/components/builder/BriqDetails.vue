<template>
    <div class="px-4 py-2 text-right">
        <h3 class="w-full">Briq details</h3>
        <p>Available briqs: {{ balance }}
            <button :disabled="fetchingBriqs" @click="getBalance(); chainBriqs.loadFromChain()">
                <i :class="'fas ' + (fetchingBriqs ? 'fa-spinner animate-spin-slow' : 'fa-sync')"></i>
            </button>
        </p>
        <p>Owned Sets: {{ chainSets.length }}
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

import { MATERIAL_GENESIS } from '../../builder/ChainBriqs';

import { defineComponent, watchEffect } from 'vue';
import { ChainBriqs } from '../../builder/ChainBriqs';
export default defineComponent({
    data() {
        return {
            data: this.$store.state.builderData,
            balance: undefined as undefined | number,
        };
    },
    beforeMount() {
        watchEffect(() => {
            this.getBalance();
        })
    },
    inject: ['messages', 'chainBriqs'],
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
            this.balance = await contractStore.briq?.balanceOf(this.$store.state.wallet.userWalletAddress, MATERIAL_GENESIS) || 0;
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