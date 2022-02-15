<script setup lang="ts">
</script>

<template>
    <div class="alternate-buttons container px-8 py-4 m-auto">
        <h1 class="text-center">Admin</h1>
        <div class="h-40 max-h-40 overflow-auto">
            <h3>Messages</h3>
            <p v-for="mess in messages">{{ mess }}</p>
        </div>
        <div>
            <h3>Minting</h3>
            <label><p><input v-model="address" type="text"/> recipient</p></label>
            <label><p><input v-model="qty" type="number"/> quantity</p></label>
            <Btn @click="mint(address, qty)">Mint</Btn>
        </div>
    </div>
</template>

<script lang="ts">
import contractStore from '../Contracts';
import { messagesStore, pushMessage } from '../Messages'
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            address: "",
            qty: 0,
        }
    },
    computed: {
        contractStore() {
            return contractStore;
        },
        messages() {
            return messagesStore.messages;
        }
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number) {
            if (!address)
            {
                pushMessage("No address");
                return;
            }
            pushMessage((await contractStore.briq?.mint(address, qty))?.toString() ?? "Failed to mint, contract is unset");
        }
    }
})
</script>