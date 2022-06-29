<script setup lang="ts">
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { genesisUserStore } from '@/builder/GenesisStore';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { computed, watchEffect } from 'vue';

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

watchEffect(() => {
    maybeStore.value?.userWalletAddress && genesisUserStore.fetchData && genesisUserStore.fetchData();
});
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
                    <routerLink to="/builder"><p>Create</p></routerLink>
                    <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener"><p>Resources</p></a>
                </div>
                <router-link v-if="genesisUserStore.availableBoxes?.length" to="/unboxing">
                    <Btn secondary class="before:border-darker">
                        <i class="fa-solid fa-box-open"/> {{ genesisUserStore.availableBoxes?.length || 0 }}
                    </Btn>
                </router-link>
                <Btn secondary class="before:border-darker">
                    <i class="fa-solid fa-cube"/> {{ 0 }}
                </Btn>
                <div class="flex-none">
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none" @click="connectDebugWallet"><span class="px-2">Dev</span></Btn>
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <MenuDropdown v-else-if="walletStore?.userWalletAddress">
                        <template #button><span class="px-2">{{ walletStore.getShortAddress() }}</span></template>
                        <Btn no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn>
                        <Btn no-background icon><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background icon><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </menudropdown>
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
