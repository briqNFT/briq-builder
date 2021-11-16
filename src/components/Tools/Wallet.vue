<template>
    <div>
        <h2>Wallet</h2>
        <button @click="connect" v-if="!contractStore.isConnected">Connect Wallet</button>
        <p v-if="contractStore.isConnected">Connected</p>
        <p v-if="contractStore.isConnected" style="word-break: break-all;">User Address: {{ address }}</p>
    </div>
</template>

<script lang="ts">

import { contractStore } from '../../Wallet';
import { openSelector } from '../WalletSelector.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            contractStore: contractStore
        }
    },
    methods: {
        connect: function() {
            openSelector.value = true;
        },
    },
    computed: {
        address: function() {
            return this.contractStore?.userWalletAddress;
        }
    }
});
</script>

<style scope>
</style>