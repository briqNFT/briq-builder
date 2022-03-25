<template>
    <h2 class="font-semibold my-4">Connect your Wallet</h2>
    <div v-if="shouldShowInstallHelp" class="font-normal">
        Argent X is currently the only available wallet for StarkNet.<br/>Please install the Google Chrome Argent X wallet extension to use briq. 
        <p class="my-2"><a target="_blank" href="https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb"><Btn>Install from Chrome Web Store</Btn></a></p>
    </div>
    <div v-if="step === 'connecting'" class="font-normal">
        <p>...Connecting to Argent x Starkware wallet...</p>
        <p>Creating an account from scratch will take some time, feel free to use the builder in the meantime.</p>
    </div>
    <div v-if="step === 'connected'" class="font-normal">
        <p class="break-all">Connected to {{ wallet.userWalletAddress }}</p>
    </div>
    <div class="absolute bottom-4 right-4">
        <p><button class="close btn float-right" @click="step='selection'; $emit('close')">{{ step == 'connected' ? 'Close' : 'Skip' }}</button></p>
        <p v-if="step !== 'connected'" class="clear-both text-sm">Not having a wallet will limit functionality to local changes only.</p>
    </div>
</template>

<script lang="ts">
import ArgentXWallet from '@/chain/wallets/ArgentX';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            handler: new ArgentXWallet(),
            step: "initial",
            wallet: this.$store.state.wallet,
        }
    },
    emits: ["close"],
    mounted()
    {
        if (this.shouldShowInstallHelp)
            return;
        this.setupConnect();
    },
    computed:
    {
        shouldShowInstallHelp() {
            return !this.handler.isLikelyAvailable();
        },
    },
    methods: {
        async setupConnect() {
            this.step = "connecting";
            try
            {
                await this.$store.dispatch("wallet/enable_wallet");
                if (this.wallet.signer)
                    this.step = "connected";
            } catch(err)
            {
                console.warn(err);
            }
        }
    }
})
</script>
