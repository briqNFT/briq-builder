<script setup lang="ts">
import UndoRedo from './UndoRedo.vue';
import SetBrowser from './set_browser/SetBrowserContainer.vue';

import HistoryLog from './modals/HistoryLog.vue';
import MenuDropdown from '../generic/MenuDropdown.vue';
import NotificationsMenu from '../NotificationsMenu.vue';
import { maybeStore } from '@/chain/WalletLoading';

import { inputStore } from '../../builder/inputs/InputStore';

// TODO: remove redundancy with Header.vue
import ProfileIcon from '@/assets/profile/profile_small.svg';
</script>

<template>
    <div class="m-4 flex justify-between" v-if="!inputStore.hideInput">
        <div>
            <div class="flex items-center gap-2 border bg-base rounded">
                <MenuDropdown no-background icon class="pr-0" :close-on-click="true">
                    <template #button><i class="fa-solid fa-bars"/></template>
                    <Btn no-background>New creation</Btn>
                    <Btn no-background>Manage your sets</Btn>
                    <hr>
                    <Btn no-background>Settings</Btn>
                </MenuDropdown>
                <div>
                    <p>{{ $store.state.builderData.currentSet.name }}</p>
                </div>
                <UndoRedo no-background secondary/>
                <Btn no-background secondary tooltip="Open the undo/redo history log" @click="pushModal(HistoryLog)">
                    <i class="fas fa-history"/>
                </Btn>
                <a href="https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f" target="_blank">
                    <Btn no-background secondary tooltip="Access the briq help"><i class="far fa-circle-question"/> Help</Btn>
                </a>
            </div>
        </div>
        <div>
            <div class="border bg-base rounded flex gap-2 px-2">
                <Btn no-background><i class="fas fa-mouse-pointer"/></Btn>
                <Btn no-background><i class="fas fa-cube"/></Btn>
                <Btn no-background><i class="fas fa-video"/></Btn>
            </div>
        </div>
        <div>
            <div class="flex items-center gap-2 border bg-base rounded">
                <div>
                    <Btn v-if="!maybeStore?.userWalletAddress" class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <MenuDropdown no-background :close-on-click="true" v-else-if="maybeStore?.userWalletAddress" class="text-xs">
                        <template #button><ProfileIcon width="1.5rem" height="1.5rem" class="inline-block mx-2"/></template>
                        <router-link :to="{ name: 'Profile' }"><Btn class="w-full text-left" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                        <Btn no-background class="text-left" icon @click="maybeStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background class="text-left" icon @click="maybeStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </MenuDropdown>
                </div>
                <NotificationsMenu/>
                <Btn>Mint</Btn>
            </div>
        </div>
    </div>
</template>
