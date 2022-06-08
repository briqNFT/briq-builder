<template>
    <div class="px-4 py-2 text-right">
        <h3 class="w-full">briq details</h3>
        <p>
            Available briqs: {{ chainBriqs.getBalance() }}
            <button :disabled="fetchingBriqs" @click="chainBriqs.loadFromChain()">
                <i :class="'fas ' + (fetchingBriqs ? 'fa-spinner animate-spin-slow' : 'fa-sync')"/>
            </button>
        </p>
        <p>
            Owned Sets: {{ chainSets.length }}
            <button :disabled="fetchingSets" @click="updateChainContracts">
                <i :class="'fas ' + (fetchingSets ? 'fa-spinner animate-spin-slow' : 'fa-sync')"/>
            </button>
        </p>
    </div>
</template>

<script lang="ts">
import { setsManager } from '../../builder/SetsManager';
import contractStore from '@/chain/Contracts';
import { reportError } from '../../Monitoring';
import { walletStore } from '@/chain/Wallet';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            data: this.$store.state.builderData,
        };
    },
    inject: ['messages', 'chainBriqs'],
    computed: {
        chainSets() {
            return setsManager.setList.map((x) => setsManager.setsInfo[x]).filter((x) => x.status !== 'LOCAL');
        },
        fetchingSets() {
            return setsManager.fetchingChainSets;
        },
        fetchingBriqs() {
            return this.chainBriqs.fetchingBriqs;
        },
    },
    methods: {
        updateChainContracts() {
            if (!contractStore.set) {
                this.messages.pushMessage('Cannot update sets - the Dapp is not connected to the contract');
                reportError(new Error('Cannot update sets - the Dapp is not connected to the contract'));
                return;
            }
            setsManager.loadOnChain(contractStore.set, walletStore.userWalletAddress);
        },
    },
});
</script>
