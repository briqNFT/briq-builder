<template>
    <h2 class="font-semibold my-4">Connect your Wallet</h2>
    <div v-if="shouldShowInstallHelp" class="font-normal">
        <p>Because StarkNet is currently in Alpha release stage, only the <span class="whitespace-nowrap">Argent x StarkWare</span> wallet is compatible<br/>
You do not have the Argent X extension installed.<br/>It is only for now only compatible with Google Chrome.</p>
        <p class="my-2"><a target="_blank" href="https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb"><Button>Install from Chrome Web Store</Button></a></p>
    </div>
    <div v-if="step === 'connecting'" class="font-normal">
        <p>...Connecting to Argent x Starkware wallet...</p>
        <p>Creating an account from scratch will take some time, feel free to use the builder in the meantime.</p>
    </div>
    <div v-if="step === 'connected'" class="font-normal">
        <p class="break-all">Connected to {{ wallet.userWalletAddress }}</p>
    </div>
    <div class="absolute bottom-4 right-4">
        <p><button class="close btn float-right" @click="step='selection'; openSelector = !openSelector">{{ step == 'connected' ? 'Close' : 'Skip' }}</button></p>
        <p v-if="step !== 'connected'" class="clear-both text-sm">Not having a wallet will limit functionality to local changes only.</p>
    </div>
</template>

<script lang="ts">
import { getPotentialWallets } from '../../Wallet'
import Button from '../generic/Button.vue'
const argentWallet = getPotentialWallets()["argentx"];

import { openSelector } from '../WalletSelector.vue';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    components: {
        Button,
    },
    data() {
        return {
            handler: new argentWallet.handler(),
            step: "initial",
            wallet: toRef(this.$store.state, "wallet"),
            openSelector
        }
    },
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
                await this.handler.enable(this.$store);
                if (this.wallet.signer)
                    this.step = "connected";
            } catch(err)
            {

            }
        }
    }
})
</script>
