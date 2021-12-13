<template>
    <div class="w-1/2">
        <div class="relative text-lg">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full py-4">Welcome to briq</h2>
            <div class="my-4">
                <p>We’re currently in <a href="">Alpha test</a> on StarkNet Mainnet. Claim 100 free briqs to start your building journey.</p>
            </div>
            <div class="font-medium break-all">
                <p v-if="status == 'calling'" class="float-left">Status: ...Minting briqs...</p>
                <p v-if="status == 'polling'" class="float-left">Status: ...Waiting for transaction to validate...<br/>
Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></p>
                <p v-if="status == 'pending'" class="float-left">Status: ...Transaction pending...<br/>
Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></p>
                <p v-if="status == 'ok'" class="float-left">Status: Transaction complete!<br/>
Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></p>
                <p v-if="status == 'error'" class="float-left">Status: Error while minting - check console for details.<br/>
Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></p>
            </div>
            <button class="btn float-right" v-if="status !== 'ok'" :disabled="status !=='waiting' && status !=='error'" @click="claim">I Want to Briq Free</button>
            <button class="btn float-right" v-if="status === 'ok'" @click="$emit('close')">Start Building</button>
        </div>
    </div>
</template>

<script lang="ts">
import { mintProxyStore } from '../../../builder/MintProxy';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            status: "waiting",
            txHash: "",
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages"],
    methods: {
        async poll() {
            let rep = await this.$store.state.wallet.provider.getTransactionStatus(this.txHash);
            if (!rep || rep.tx_status === 'REJECTED')
            {
                this.status = 'error';
                this.messages.pushMessage("Error while minting briqs - see console for details.");
                return
            }
            else if (rep.tx_status === 'PENDING')
                this.status = 'pending';
            else if (rep.tx_status === 'ACCEPTED_ON_L2')
            {
                this.status = 'ok';
                mintProxyStore.canMint = false;
                mintProxyStore.hasMinted = true;
                this.messages.pushMessage("Starting briqs successfully claimed !");
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