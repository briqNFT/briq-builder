<script setup lang="ts">
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBidsStore } from '@/builder/BidStore';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { onMounted, computed } from 'vue';
import Notifications from '../Notifications.vue';

import ProfileIcon from '@/assets/profile/profile_small.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import { notificationsManager } from '@/Notifications';

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

onMounted(() => {
    userBidsStore.setup();
});

const hasUnreadNotifications = computed(() => notificationsManager.notifications.some(x => x.shouldShow() && !x.read));

</script>

<template>
    <div>
        <div
            class="header container m-auto py-4 flex justify-between items-center text-center alternate-buttons">
            <div class="flex">
                <routerLink to="/genesis"><h2 class="briq-logo text-[32px]">briq</h2></routerLink>
            </div>
            <div class="flex items-stretch gap-2">
                <div class="flex gap-1 md:gap-6 mx-2 md:mr-4 text-sm md:text-md flex-wrap justify-center items-center md:justify-end font-normal">
                    <routerLink to="/themes"><p>Themes</p></routerLink>
                    <routerLink to="/builder"><p>Create</p></routerLink>
                    <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener"><p>Resources</p></a>
                </div>
                <router-link v-if="userBoxesStore.current?.availableBoxes?.length" to="/unboxing">
                    <Btn secondary class="before:border-darker">
                        <i class="fa-solid fa-box-open"/> {{ userBoxesStore.current?.availableBoxes?.length || 0 }}
                    </Btn>
                </router-link>
                <div class="border-darker bg-base px-3 border rounded-md flex items-center justify-center gap-2">
                    <briqIcon class="inline-block"/> {{ 0 }}
                </div>
                <div class="flex-none">
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none hidden md:inline-block" @click="connectDebugWallet"><span class="px-2">Dev</span></Btn>
                    <Btn v-if="!walletStore?.userWalletAddress" class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <MenuDropdown no-background :close-on-click="true" v-else-if="walletStore?.userWalletAddress" class="text-xs">
                        <template #button><ProfileIcon width="1.5rem" height="1.5rem" class="inline-block mx-2"/></template>
                        <router-link :to="{ name: 'Profile' }"><Btn class="w-full text-left" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                        <Btn no-background class="text-left" icon @click="walletStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background class="text-left" icon @click="walletStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </MenuDropdown>
                </div>
                <MenuDropdown no-background class="min-w-[3rem]">
                    <template #icon>
                        <i class="fa-regular fa-bell"/>
                        <span class="text-accent absolute top-2 right-2 text-lg" v-if="hasUnreadNotifications">•</span>
                    </template>
                    <Notifications class="p-4 min-w-[26rem]"/>
                </MenuDropdown>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
