<template>
    <div class="w-1/2">
        <div class="relative text-lg">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full py-4">Welcome to briq</h2>
            <div class="my-4">
                <p>We’re currently in <a href="">Alpha test</a> on StarkNet Mainnet. Claim 100 free briqs to start your building journey.</p>
            </div>
            <div class="font-medium">
                <p v-if="status == 'calling'">Status: ...Minting briqs...</p>
                <p v-if="status == 'polling'">Status: ...Waiting for transaction to validate...<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></span></p>
                <p v-if="status == 'pending'">Status: ...Transaction pending...<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></span></p>
                <p v-if="status == 'ok'">Status: Transaction complete!<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></span></p>
                <p v-if="status == 'error'">Status: Error while minting - check console for details.<br/>
<span v-if="txHash">Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></span></p>
            </div>
            <div class="flex justify-center my-4">
                <button class="btn" v-if="status !== 'ok'" :disabled="status !=='waiting' && status !=='error'" @click="claim">I Want to Briq Free</button>
                <button class="btn" v-if="status === 'ok'" @click="$emit('close')">Start Building</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '../../../builder/MintProxy';
import { Transaction, transactionsManager } from '../../../builder/Transactions';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            status: "waiting",
            txHash: "",
            tx: undefined as undefined | Transaction
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages"],
    async mounted() {
        console.log(transactionsManager.get("mint_proxy").filter(x => x.isOk()));
        this.tx = transactionsManager.get("mint_proxy").filter(x => x.isOk())?.[0];
        if (this.tx)
        {
            this.status = 'pending';
            this.txHash = this.tx.hash;
            await this.poll();
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
                this.$store.dispatch('builderData/get_briqs');
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
                let tx = this.$store.state.builderData.mintContract.mint(this.$store.state.wallet.userWalletAddress);
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
                this.status = "error";
                console.error(err);
                this.messages.pushMessage("Error while minting briqs - see console for details.");
            }
        }
    }
})
</script>