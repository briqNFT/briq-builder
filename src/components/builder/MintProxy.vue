<template>
    <div v-if="canMint && signer" class="absolute inset-x-0 bottom-0 container w-1/2 m-auto py-2 alternate-buttons">
        <h2 class="text-center font-display">
            <button @click="claim" class="btn">
                <span class="inline-block whitespace-pre"> Claim your 1000 briqs </span>
                <span class="inline-block">and start building</span>
            </button>
        </h2>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '@/chain/MintProxy';
import { pushModal } from '../Modals.vue';
import MintModalVue from './modals/MintModal.vue';
import { walletStore } from '@/chain/Wallet';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return mintProxyStore;
    },
    computed: {
        signer() {
            return walletStore.signer;
        },
    },
    methods: {
        claim() {
            pushModal(MintModalVue);
        },
    },
});
</script>
