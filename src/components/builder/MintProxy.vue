<template>
    <div v-if="canMint" class="absolute inset-x-0 bottom-0 container w-1/2 m-auto py-2 alternate-buttons">
        <h2 class="text-center"><button @click="claim" class="btn">Claim your 100 Briqs & start building</button></h2>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '../../builder/MintProxy'
import { pushModal } from '../Modals.vue';
import MintModalVue from './modals/MintModal.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return mintProxyStore
    },
    methods: {
        claim() {
            pushModal(MintModalVue);
        }
    }
})
</script>