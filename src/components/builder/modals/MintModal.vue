<template>
    <div class="w-1/2">
        <div class="relative text-lg">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full py-4">Claim your free briqs</h2>
            <div class="my-4">
                <p>Briq is currently an Alpha project running on StarkNet.</p>
                <p>You can claim 100 free on-chain briqs, and export your NFTs on chain.</p>
                <p>Some more text here...</p>
            </div>
            <div class="font-medium break-all">
                <p v-if="status == 'calling'" class="float-left">Status: ...Minting briqs...</p>
                <p v-if="status == 'polling'" class="float-left">Status: ...Waiting for transaction to validate...<br/>
Tx Hash: <a target="_blank" :href="'https://goerli.voyager.online/tx/' + txHash">{{ txHash }}</a></p>
                <p v-if="status == 'error'" class="float-left">Status: Error while minting - check console for details.</p>
            </div>
            <button class="btn float-right" :disabled="status !=='waiting' && status !=='error'" @click="claim">Claim</button>
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
    methods: {
        async poll() {
            let rep = await this.$store.state.wallet.provider.getTransactionStatus(this.txHash);
            if (!rep || rep.tx_status === 'REJECTED')
            {
                this.status = 'error';
                console.error(rep);
                return
            }
            console.log(rep);
            setTimeout(async () => {
                await this.poll();
            }, 500);
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
                console.error(err)
            }
        }
    }
})
</script>