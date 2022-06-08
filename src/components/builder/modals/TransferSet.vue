<template>
    <Window class="lg:!w-2/3 xl:!w-1/2 !w-full">
        <template #big-title>Transfer Set</template>
        <div class="my-8">
            <input
                class="w-full"
                type="text"
                placeholder="Starkware Address to transfer to (hex format: 0xACDE...)"
                v-model="target">
        </div>
        <Btn class="float-right" :disabled="!formatOk" @click="doTransfer">Transfer</Btn>
    </Window>
</template>

<script lang="ts">
import { Transaction } from '../../../builder/Transactions';

import contractStore from '@/chain/Contracts';
import { walletStore } from '@/chain/Wallet';

import { defineComponent, nextTick, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            target: '',
        };
    },
    props: ['metadata'],
    inject: ['messages', 'reportError'],
    computed: {
        formatOk() {
            return this.target.match(/^0x[abcdef0-9]{63,64}$/gi);
        },
    },
    methods: {
        async doTransfer() {
            if (!this.formatOk)
                return;
            try {
                let tx = await contractStore.set?.transferOneNFT(
                    walletStore.userWalletAddress,
                    this.target,
                    this.metadata.setId,
                );
                new Transaction(tx.transaction_hash, 'transfer', { setId: this.metadata.setId });
                this.messages.pushMessage('Set transfer ongoing - ' + tx.transaction_hash);
            } catch (err) {
                this.messages.pushMessage('Error while transferring set - See console for details.');
                console.error(err);
                this.reportError(err);
            }
            this.$emit('close');
        },
    },
    watch: {
        target(nv, ov) {
            if (nv.length - 20 > ov.length && nv.length < 65)
                if (nv.match(/^0x[abcdef0-9]{25,}$/gi))
                    // Assume we just pasted an address, maybe it's missing leading zero (argentX issue).
                    // (also assume not like 30 zeros).
                    this.target = '0x' + '0'.repeat(65 - nv.length) + nv.substr(2);
        },
    },
});
</script>
