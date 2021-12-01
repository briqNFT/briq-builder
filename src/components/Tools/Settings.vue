<template>
    <div class="w-48 relative">
        <div class="w-full md:w-48 absolute">
            <button @click="slideOpen = !slideOpen" style="z-index: 1; position:relative;" class="btn w-full">{{ titleText() }}</button>
            <div :class="(slideOpen ? 'open' : 'close') + ' slidingMenu w-full relative overflow-y-hidden'">
                <div class="bg-briq-light px-1 py-0.5 rounded-b">
                    <p><button class="w-full" @click="contractStore.isConnected ? disconnect() : connect()">
                        {{ contractStore.isConnected ? "Disconnect" : "Connect Wallet" }}
                    </button></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { openSelector } from '../WalletSelector.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            slideOpen: false,
            contractStore: this.$store.state.wallet
        }
    },
    methods: {
        titleText: function() {
            let ret = "Briq";
            if (this.contractStore.isConnected)
                ret += ': ' + this.contractStore.userWalletAddress.substr(0, 5) + '...' + this.contractStore.userWalletAddress.substr(-5, 5);
                return ret;
        },
        connect: function() {
            openSelector.value = true;
        },
        disconnect: function() {
            openSelector.value = true;
        },
    },
})
</script>

<style scoped>
.slidingMenu {
    transition: all 0.2s;
    @apply px-1;
}
.slidingMenu.open {
    max-height: 30rem;
}
.slidingMenu.close {
    max-height: 0px;
}
.slidingMenu button {
    @apply rounded px-3 py-1 my-0.5;
    @apply h-10;
}
.slidingMenu button:not(:disabled):hover {
    @apply bg-briq;
}
.slidingMenu button:not(:disabled):active {
    @apply border-2 border-deep-blue;
    @apply bg-briq;
}
.slidingMenu button:disabled {
    @apply bg-gray-300;
    @apply text-gray-600;
}

</style>
