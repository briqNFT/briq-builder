<script setup lang="ts">
import Button from '../../generic/Button.vue';
</script>

<template>
    <div class="md:w-1/3 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Transfer Set</h2>
            <div class="my-8">
                <input class="w-full" type="text" placeholder="Starkware Address to transfer to (hex format: 0xACDE...)" v-model="target"/>
            </div>
            <Button class="float-right" :disabled="!formatOk" @click="doTransfer">Transfer</Button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            target: "",
        }
    },
    props: ["metadata"],
    computed: {
        formatOk() {
            return this.target.match(/0x[abcdef0-9]{63}/gi);
        }
    },
    methods: {
        async doTransfer()
        {
            if (!this.formatOk)
                return;
            try {
                let bricks = this.metadata.data.briqs.map(x => "0x" + x.data.briq.toString(16))
                console.log(this.$store.state.wallet.userWalletAddress, this.target, this.metadata.setId, bricks);
                let tx = await this.$store.state.builderData.setContract.transfer_from(this.$store.state.wallet.userWalletAddress, this.target, this.metadata.setId, bricks);
                console.log(tx);
            }
            catch(err)
            {
                console.error(err);

            }
            //$emit('close')
        }
    }
})</script>