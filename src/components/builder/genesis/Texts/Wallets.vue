<script setup lang="ts">
import { maybeStore } from '@/chain/WalletLoading';
import { computed } from 'vue';

const props = defineProps<{
    active: boolean,
}>();

const walletStore = computed(() => maybeStore.value!);
</script>

<template>
    <hr>
    <p>You recite the ancient incantations in an untold language.</p>
    <p>StarkNet address: {{ walletStore.userWalletAddress }}</p>
    <p>Ethereum address: {{ 'TODO' }}</p>
    <p class="flex justify-center gap-2 my-4 text-md">
        <Btn :disabled="!props.active" v-if="!walletStore.userWalletAddress" @click="walletStore.openWalletSelector()">Connect to StarkNet</Btn>
        <Btn :disabled="!props.active" v-else>StarkNet Wallet</Btn>
        <Btn :disabled="!props.active">Connect to Ethereum</Btn>
    </p>
</template>
