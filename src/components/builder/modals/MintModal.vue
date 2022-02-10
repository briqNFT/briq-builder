<template>
    <div class="w-1/2">
        <div class="relative text-lg">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full py-4">Welcome to briq</h2>
            <div class="my-4">
                <p>We’re currently in <a href="">Alpha test</a> on StarkNet TestNet.<br/>Claim 1000 free briqs to start your building journey.</p>
            </div>
            <template v-if="$store.state.wallet.baseUrl.indexOf('mainnet') !== -1 ">
            <div class="font-medium text-xl">
                <p>Mission accomplished folks !<br/>briq was working so well that mainnet costs on L1 are too high for StarkWare, so we're temporarily turning Mainnet briq off.<br/>Please switch to Testnet to use Briq!<br/>
                <br/>Follow this <a target="_blank" href="https://twitter.com/briqNFT/status/1476284938773221382?ref_src=twsrc%5Etfw" class="underline">twitter thread</a> for more information.
                </p>
            </div>
            <div class="flex justify-center my-4 gap-2">
                <button class="btn" :disabled="true">I want to briq free</button>
            </div>

            </template>
            <template v-else-if="!$store.state.wallet.starknetAddress">
            <div class="font-medium text-xl">
                <p>Failed to reach the Starknet Gateway. This may happen because of rate-limiting on the Starknet side.<br/>
                If you're on main-net, try on testnet, or retry later.</p>
            </div>
            <div class="flex justify-center my-4 gap-2">
                <button class="btn" :disabled="true">I want to briq free</button>
            </div>

            </template>
            <template v-else-if="!mintProxyStore.walletOk">
            <div class="font-medium text-xl">
                <p>Your wallet is not yet deployed. Please check Voyager Explorer,
                you should see the deploy transaction before you can claim briqs.</p>
            </div>
            <div class="flex justify-center my-4 gap-2">
                <a :href="voyagerLink" target="_blank"><Btn>Check Voyager</Btn></a>
                <button class="btn" :disabled="true">I want to briq free</button>
            </div>

            </template>
            <template v-else="">
            <div class="font-medium">
                <p v-if="status == 'calling'">Status: ...Minting briqs...</p>
                <p v-if="status == 'polling'">Status: ...Waiting for transaction to validate...<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash" class="break-all">{{ txHash }}</a></span></p>
                <p v-if="status == 'pending'">Status: ...Transaction pending...<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash" class="break-all">{{ txHash }}</a></span></p>
                <p v-if="status == 'ok'">Status: Transaction complete!<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash" class="break-all">{{ txHash }}</a></span></p>
                <p v-if="status == 'error'">Status: Error while minting.
<span v-if="txHash"><br/>Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash" class="break-all">{{ txHash }}</a></span>
                Error details: <br/> <span class="font-mono text-xs tracking-tighter">{{ errorDetails }}</span></p>
            </div>
            <div class="flex justify-center my-4">
                <button class="btn" v-if="status !== 'ok'" :disabled="status !=='waiting' && status !=='error'" @click="claim">I want to briq free</button>
                <button class="btn" v-if="status === 'ok'" @click="$emit('close')">Start Building</button>
            </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '../../../builder/MintProxy';
import { Transaction, transactionsManager } from '../../../builder/Transactions';

import type { Provider } from 'starknet';
import contractStore from '../../../Contracts';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            status: "waiting",
            errorDetails: "",
            txHash: "",
            tx: undefined as undefined | Transaction,
            mintProxyStore
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages", "reportError", "chainBriqs"],
    async mounted() {
        this.tx = transactionsManager.get("mint_proxy").filter(x => x.isOk())?.[0];
        if (this.tx)
        {
            this.status = 'pending';
            this.txHash = this.tx.hash;
            await this.poll();
        }
    },
    computed: {
        voyagerLink() {
            if ((this.$store.state.wallet.provider as Provider).gatewayUrl.search("mainnet") !== -1)
                return `https://voyager.online/contract/${this.$store.state.wallet.userWalletAddress}`
            else
                return `https://goerli.voyager.online/contract/${this.$store.state.wallet.userWalletAddress}`
        }
    },
    methods: {
        async poll() {
            if (!this.tx)
                return;
            await this.tx.poll();
            if (!this.tx.isOk())
            {
                this.status = 'error';
                try {
                    this.errorDetails = await this.tx.getMetadata();
                } catch (err)
                {
                    this.errorDetails = "Could not get tx metadata, error: " + err?.toString() ?? err;
                }
                this.messages.pushMessage("Error while minting briqs - see console for details.");
                return
            }
            else if (this.tx.isPending())
                this.status = 'pending';
            else if (this.tx.isOnChain())
            {
                this.status = 'ok';
                mintProxyStore.canMint = false;
                mintProxyStore.hasMinted = true;
                this.messages.pushMessage("Starting briqs successfully claimed !");
                this.chainBriqs.loadFromChain();
                return;
            }
            setTimeout(async () => {
                await this.poll();
            }, 1000);
        },
        async claim() {
            this.status = "calling";
            try
            {
                let tx = contractStore.mint.mint(this.$store.state.wallet.userWalletAddress);
                let res = await tx;
                if (res.code !== 'TRANSACTION_RECEIVED')
                    throw new Error("Unknown error when minting, status is " + res.code + ", Tx hash " + (res?.transaction_hash ?? 'unknown'));
                this.txHash = res.transaction_hash;
                new Transaction(this.txHash, "mint_proxy");
                this.tx = transactionsManager.getTx(this.txHash);
                this.status = "polling";
                setTimeout(async () => {
                    await this.poll();
                }, 200);
            }
            catch(err)
            {
                if (err?.message === "User abort") {
                    this.messages.pushMessage("Minting aborted.");
                    this.errorDetails = "Aborted by user.";
                } else {
                    console.error(err);
                    this.reportError(err);
                    this.messages.pushMessage("Error while minting briqs - see console for details.");
                    this.errorDetails = err?.toString() ?? err;
                }
                this.status = "error";
            }
        }
    }
})
</script>