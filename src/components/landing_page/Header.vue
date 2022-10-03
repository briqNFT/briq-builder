<script setup lang="ts">
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBidsStore } from '@/builder/BidStore';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { onMounted, computed } from 'vue';
import NotificationsList from '../NotificationsList.vue';

import { useBuilder } from '@/components/builder/BuilderComposable';

import SmallProfileIcon from '@/assets/profile/profile_small.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import { notificationsManager } from '@/Notifications';
import NotificationsMenu from '../NotificationsMenu.vue';
import { userPurchaseStore } from '@/builder/UserPurchase';

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
    userPurchaseStore.setup();
});

const { chainBriqs } = useBuilder();

</script>

<template>
    <div>
        <div
            class="header container m-auto py-3 px-8 flex justify-between items-center text-center alternate-buttons">
            <div class="flex">
                <routerLink to="/genesis"><h2 class="briq-logo text-[32px]">briq</h2></routerLink>
            </div>
            <div class="flex items-stretch gap-2">
                <div class="flex gap-1 md:gap-6 mx-2 md:mr-4 flex-wrap justify-center items-center md:justify-end text-sm md:text-md font-medium">
                    <routerLink to="/"><p class="hover:text-primary">Home</p></routerLink>
                    <routerLink to="/themes"><p class="hover:text-primary">Themes</p></routerLink>
                    <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener" target="_blank"><p class="hover:text-primary">Resources</p></a>
                </div>
                <router-link v-if="userBoxesStore.current?.availableBoxes?.length" to="/unboxing">
                    <Btn secondary class="before:border-grad-darker">
                        <i class="fa-solid fa-box-open"/> {{ userBoxesStore.current?.availableBoxes?.length || 0 }}
                    </Btn>
                </router-link>
                <template v-if="walletStore?.userWalletAddress">
                    <div class="border-grad-light px-3 border rounded flex items-center justify-center gap-2 font-medium">
                        <briqIcon class="inline-block"/> {{ chainBriqs?.getNbBriqs() }}
                    </div>
                    <div class="flex-none">
                        <MenuDropdown no-background icon :close-on-click="true" class="text-xs">
                            <template #button><SmallProfileIcon width="1rem" height="1rem" class="inline-block !mr-2"/></template>
                            <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                            <Btn no-background class="justify-start" icon @click="walletStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                            <Btn no-background class="justify-start" icon @click="walletStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                        </MenuDropdown>
                    </div>
                    <NotificationsMenu/>
                </template>
                <template v-else>
                    <Btn class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                </template>
                <routerLink to="/builder"><Btn>Create</Btn></routerLink>
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

    @apply bg-primary px-2 py-0.5 text-text-on-primary text-sm;
    position: absolute;
    top: -1rem;
    right: -1rem;

    @apply rounded-md shadow-sm;
}

</style>
