<template>
    <h2 class="font-semibold">Argent x Starkware wallet</h2>
    <div v-if="shouldShowInstallHelp">
        <p>You do not have the Argent X extension installed.<br/>It is only for now only compatible with Google Chrome.</p>
        <p class="my-2"><a target="_blank" href="https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb"><Button>Install from Chrome Web Store</Button></a></p>
    </div>
    <div v-if="step === 'connecting'">
        <p>...Connecting to Argent x Starkware wallet...</p>
        <p>Creating an account from scratch will take some time, feel free to use the builder in the meantime.</p>
    </div>
    <div v-if="step === 'connected'">
        <p class="break-all">Connected to {{ wallet.userWalletAddress }}</p>
    </div>
</template>

<script lang="ts">
import { getPotentialWallets } from '../../Wallet'
import Button from '../generic/Button.vue'
const argentWallet = getPotentialWallets()["argentx"];

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
