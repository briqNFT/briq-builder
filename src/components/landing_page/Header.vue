<script setup lang="ts">
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBidsStore } from '@/builder/BidStore';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { onMounted, computed, ref } from 'vue';

import SmallProfileIcon from '@/assets/profile/profile_small.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import NotificationsMenu from '../NotificationsMenu.vue';
import { userPurchaseStore } from '@/builder/UserPurchase';
import { chainBriqs } from '@/builder/ChainBriqs';

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

const header = ref(null);

onMounted(() => {
    userBidsStore.setup();
    userPurchaseStore.setup();
    const observer = new IntersectionObserver(
        ([e]) => {
            e.target.classList.toggle('isSticky', e.intersectionRatio < 1)
        },
        { threshold: [1] },
    );
    observer.observe(header.value);
});

</script>

<style scoped>
#app .isSticky {
    box-shadow: 0 3px 6px 0 rgba(var(--color-grad-darker) /  0.05);
}
</style>

<template>
    <div class="sticky top-[-1px] bg-background z-[50000] shadow-none transition-all duration-500" ref="header">
        <div
            class="relative top-[1px] header container m-auto py-3 flex justify-between items-center text-center alternate-buttons">
            <div class="flex items-center gap-4 md:gap-12">
                <routerLink to="/genesis"><h2 class="briq-logo text-[32px]">briq</h2></routerLink>
                <routerLink to="/themes">
                    <p class="hover:text-primary text-sm md:text-md font-medium relative top-[0.2em]">Themes</p>
                </routerLink>
                <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener" target="_blank">
                    <p class="hover:text-primary text-sm md:text-md font-medium relative top-[0.2em]">Resources</p></a>
            </div>
            <div class="flex items-stretch gap-2">
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
                        <MenuDropdown no-background icon class="text-xs">
                            <template #button><SmallProfileIcon width="1rem" height="1rem" class="inline-block !mr-2"/></template>
                            <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                            <Btn no-background class="justify-start" icon @click="walletStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                            <Btn no-background class="justify-start" icon @click="walletStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                        </MenuDropdown>
                    </div>
                    <NotificationsMenu/>
                </template>
                <template v-else>
                    <Btn class="flex-none text-md" secondary @click="connectWallet">Connect</Btn>
                </template>
                <routerLink to="/builder"><Btn class="text-md">Create</Btn></routerLink>
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
