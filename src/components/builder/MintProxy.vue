<template>
    <div v-if="canMint" class="absolute inset-x-0 bottom-0 container w-1/2 m-auto py-2 alternate-buttons">
        <h2 class="text-center"><button @click="claim" class="btn bg-transparent">Claim your 100 Briqs & start building</button></h2>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '../../builder/MintProxy'
import { setModal } from '../MiddleModal.vue';
import MintModalVue from './modals/MintModal.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return mintProxyStore
    },
    methods: {
        claim() {
            setModal(MintModalVue);
        }
    }
})
</script>