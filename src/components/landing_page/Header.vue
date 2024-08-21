<script setup lang="ts">
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { WEB_WALLET_URL, maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { computed, onMounted, ref } from 'vue';
import { maybeChainBriqs, maybeLegacyBriqs } from '@/builder/ChainBriqsAsync';

import SmallProfileIcon from '@/assets/profile/profile_small.svg';
import briqLogo from '@/assets/briq.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import { APP_ENV } from '@/Meta';
import Tooltip from '../generic/Tooltip.vue';
import ArgentLogo from '@/assets/argent_logo.svg';
import DojoBanner from '../DojoBanner.vue';

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

const pendingBriqs = computed(() => {
    if (!maybeChainBriqs.value)
        return false;
    return Object.keys(maybeChainBriqs.value!.metadata).length;
});

const nbOfBriqs = computed(() => {
    return maybeChainBriqs.value?.getNbBriqs() + (maybeLegacyBriqs.value?.current?.getNbBriqs() || 0)
})

let NotificationsMenu = ref();
import('@/Dispatch').then(x => NotificationsMenu.value = x.NotificationsMenu);

const header = ref(null);

onMounted(() => {
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
::v-deep(button.roundedButton)::before {
    @apply !rounded;
}
.pendingBriqs::before {
    content:' ';
    @apply absolute top-0 left-0 w-full h-full bg-red-100;
}
</style>

<template>
    <div class="sticky top-[-1px] bg-background z-[1000] shadow-none transition-all duration-500" ref="header">
        <div
            class="relative top-[1px] header container m-auto py-3 flex justify-between items-center text-center alternate-buttons">
            <div class="flex items-center gap-4 md:gap-12">
                <routerLink to="/"><briqLogo height="1.5rem"/></routerLink>
                <routerLink to="/themes">
                    <p class="hover:text-primary text-sm md:text-md font-medium">Themes</p>
                </routerLink>
                <a class="hidden sm:block" href="https://www.notion.so/hyle-org/briqipedia-ae6a1d92745044cc9c2274251a5212f3" rel="noopener" target="_blank">
                    <p class="hover:text-primary text-sm md:text-md font-medium">Resources</p>
                </a>
                <routerLink class="hidden sm:block" to="/get_briqs">
                    <p class="hover:text-primary text-sm md:text-md font-medium brea">Get&nbsp;briqs</p>
                </routerLink>
                <routerLink class="hidden sm:block" to="/games">
                    <p class="hover:text-primary text-sm md:text-md font-medium brea">Games</p>
                </routerLink>
                <div v-if="APP_ENV === 'dev'" class="hidden lg:block text-info-info font-semibold px-2 py-1">DEV ENV - FOR TESTING ONLY</div>
                <div v-else-if="APP_ENV !== 'prod'" class="hidden lg:block text-primary font-semibold px-2 py-1">STAGING ENV - FOR TESTING ONLY</div>
            </div>
            <div class="flex items-stretch gap-2">
                <template v-if="walletStore?.userWalletAddress">
                    <template v-if="pendingBriqs">
                        <Tooltip tooltip="Some transactions are pending that might change your briq count.">
                            <div class="hidden sm:flex border-grad-light px-3 border rounded flex items-center justify-center gap-2 font-medium">
                                <briqIcon width="0.9rem" class="inline-block hue-rotate-180 brightness-[1.3] saturate-[0.8]"/>
                                <span class="text-info-info"> {{ nbOfBriqs }}</span>
                            </div>
                        </Tooltip>
                    </template>
                    <template v-else>
                        <div class="hidden sm:flex border-grad-light px-3 border rounded flex items-center justify-center gap-2 font-medium">
                            <briqIcon width="0.9rem" class="inline-block"/> {{ nbOfBriqs }}
                        </div>
                    </template>
                    <div class="flex-none">
                        <MenuDropdown no-background icon class="text-xs roundedButton">
                            <template #button><SmallProfileIcon width="1rem" height="1rem" class="inline-block !mr-2"/></template>
                            <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                            <a v-if="walletStore.isWebWallet()" :href="WEB_WALLET_URL" target="_blank"><Btn no-background class="w-full justify-start text-left py-1" icon><ArgentLogo width="1rem" height="1rem"/> Web wallet<br>dashboard</Btn></a>
                            <Btn no-background class="justify-start" icon @click="walletStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                            <Btn no-background class="justify-start" icon @click="walletStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                        </MenuDropdown>
                    </div>
                    <component v-if="NotificationsMenu" :is="NotificationsMenu" class="hidden sm:block"/>
                </template>
                <template v-else-if="!walletStore?.userWalletAddress && walletStore?._userWalletAddress">
                    <MenuDropdown no-background icon class="text-xs py-0 px-1 roundedButton">
                        <template #button>
                            <div class="select-none z-10 rounded font-normal bg-primary bg-opacity-20 text-sm text-primary p-2">
                                <span class="hidden md:block">Wrong network, switch to mainnet</span>
                                <span class="md:hidden block">Switch to mainnet</span>
                            </div>
                            <SmallProfileIcon width="1rem" height="1rem" class="inline-block !mx-2"/>
                        </template>
                        <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                        <a v-if="walletStore.isWebWallet()" :href="WEB_WALLET_URL" target="_blank"><Btn no-background class="w-full justify-start text-left py-1" icon><ArgentLogo width="1rem" height="1rem"/> Web wallet<br>dashboard</Btn></a>
                        <Btn no-background class="justify-start" icon @click="walletStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background class="justify-start" icon @click="walletStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </MenuDropdown>
                </template>
                <template v-else>
                    <Btn class="flex-none text-md" secondary @click="connectWallet">Connect</Btn>
                </template>
                <routerLink to="/builder"><Btn class="text-md">Create</Btn></routerLink>
            </div>
        </div>
        <DojoBanner/>
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
