<script setup lang="ts">
import UndoRedo from './UndoRedo.vue';

import HistoryLog from './modals/HistoryLog.vue';
import MenuDropdown from '../generic/MenuDropdown.vue';
import NotificationsMenu from '../NotificationsMenu.vue';
import { maybeStore } from '@/chain/WalletLoading';

import { inputStore } from '../../builder/inputs/InputStore';

// TODO: remove redundancy with Header.vue
import ProfileIcon from '@/assets/profile/profile_small.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import MenuBuilder from './MenuBuilder.vue';

const store = useStore();

const getNbBriqs = computed(() => {
    // Vue reactiveness, this is opt-in for performance.
    store.state.builderData.currentSet.usedByMaterial_;
    let used = 0;
    for (let mat in store.state.builderData.currentSet.usedByMaterial)
        used += store.state.builderData.currentSet.usedByMaterial[mat];

    let selected = '';
    if (['inspect', 'inspect_va', 'inspect_box', 'drag', 'rotate', 'copy_paste'].indexOf(
        inputStore.currentInput,
    ) !== -1 && inputStore.selectionMgr.selectedBriqs.length > 0)
        selected = `${inputStore.selectionMgr.selectedBriqs.length} selected\n`;
    return `${selected}${used} briqs`;
});

const menuOpen = ref(false);
</script>

<style scoped>
.divider {
    @apply w-[1px] bg-grad-light h-[24px];
}
</style>

<template>
    <div class="mx-4 mt-4 flex justify" v-if="!inputStore.hideInput">
        <div class="flex-1 basis-1 min-w-max flex">
            <div class="flex flex-none items-center px-2 py-1 gap-2 border border-grad-light bg-grad-lightest rounded-md">
                <router-link :to="{ name: 'Profile' }"><Btn no-background><i class="fa-solid fa-arrow-left"/></Btn></router-link>
                <Btn no-background @click="menuOpen = !menuOpen"><i class="fa-solid fa-bars"/></Btn>
                <div class="divider"/>
                <div class="flex flex-none px-2 gap-2 items-baseline">
                    <p class="font-semibold">{{ $store.state.builderData.currentSet.name }}</p>
                    <p class="text-grad-dark">{{ getNbBriqs }}</p>
                </div>
                <div class="divider"/>
                <UndoRedo no-background secondary class="flex-none px-1"/>
                <Btn no-background secondary tooltip="Open the undo/redo history log" @click="pushModal(HistoryLog)">
                    <i class="fas fa-history"/>
                </Btn>
                <div class="divider"/>
                <a href="https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f" target="_blank">
                    <Btn icon no-background secondary tooltip="Access the briq help"><i class="far fa-circle-question"/> Help</Btn>
                </a>
            </div>
        </div>
        <div class="flex-1 basis-1 flex justify-center">
            <div class="border bg-grad-lightest rounded-md flex gap-2 px-2 py-1">
                <Btn no-background><i class="fas fa-mouse-pointer"/></Btn>
                <Btn no-background><i class="fas fa-cube"/></Btn>
                <Btn no-background><i class="fas fa-video"/></Btn>
            </div>
        </div>
        <div class="flex-1 basis-1 flex justify-end">
            <div class="flex items-stretch gap-1 px-2 py-1 border bg-grad-lightest rounded-md">
                <div class="flex items-center justify-center font-medium gap-2 px-2">
                    <briqIcon class="inline-block"/> {{ 0 }}
                </div>
                <div>
                    <Btn v-if="!maybeStore?.userWalletAddress" class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <MenuDropdown no-background icon :close-on-click="true" v-else-if="maybeStore?.userWalletAddress" class="text-xs">
                        <template #button><ProfileIcon width="1rem" height="1rem" class="inline-block"/></template>
                        <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                        <Btn no-background class="justify-start" icon @click="maybeStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background class="justify-start" icon @click="maybeStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </MenuDropdown>
                </div>
                <NotificationsMenu/>
                <Btn>Mint</Btn>
            </div>
        </div>
    </div>
    <MenuBuilder :open="menuOpen"/>
</template>
