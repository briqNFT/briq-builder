<script setup lang="ts">
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';

let _clicked = false;
const walletStore = maybeStore;
const connectWallet = () => {
    if (walletStore.value)
        walletStore.value.openWalletSelector()
    else if (!_clicked) {
        _clicked = true;
        walletInitComplete.then(() => walletStore.value!.openWalletSelector());
    }
}
const connectDebugWallet = () => window.useDebugProvider();
</script>

<template>
    <div>
        <div
            class="header m-auto flex justify-between items-center text-center alternate-buttons">
            <div class="flex">
                <routerLink to="/genesis"><h2 class="briq-logo briq text-[32px]">briq</h2></routerLink>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex gap-8 flex-wrap justify-center md:justify-end font-normal">
                    <routerLink to="/team"><p>Team</p></routerLink>
                    <routerLink to="/gallery"><p>Gallery</p></routerLink>
                    <routerLink to="/builder"><p>Create</p></routerLink>
                    <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener"><p>Resources</p></a>
                </div>
                <div class="flex-none">
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none" @click="connectDebugWallet"><span class="px-2">Dev</span></Btn>
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <Btn v-else-if="walletStore?.userWalletAddress" class="flex-none" @click="walletStore!.openWalletSelector()"><span class="px-2">{{ walletStore.getShortAddress() }}</span></Btn>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.header > div {
    @apply py-8;
}
.header {
    @apply container m-auto;
}

.alpha-pill {
    position: relative;
}
.alpha-pill ::after {
    display: block;
    content: 'alpha';
    font-style: italic;

    @apply bg-accent px-2 py-0.5 text-text-on-accent text-sm;
    position: absolute;
    top: -1rem;
    right: -1rem;

    @apply rounded-md shadow-sm;
}
html:not(.v2design) .briq-logo {
    @apply bg-base;
}
html:not(.v2design) * {
    @apply text-md font-medium;
}

</style>
