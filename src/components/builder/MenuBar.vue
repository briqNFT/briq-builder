<script setup lang="ts">
import { computed, ref } from 'vue';
import UndoRedo from './UndoRedo.vue';

import ShortcutModal from './modals/ShortcutModal.vue';
import MenuDropdown from '../generic/MenuDropdown.vue';
import NotificationsMenu from '../NotificationsMenu.vue';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';

import { inputStore } from '../../builder/inputs/InputStore';

// TODO: remove redundancy with Header.vue
import ProfileIcon from '@/assets/profile/profile_small.svg';
import briqIcon from '@/assets/landing/briq-icon.svg';
import MenuBuilder from './MenuBuilder.vue';
import { useBuilderInput } from './InputComposable';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ExportSetVue from './modals/ExportSet.vue';
import { pushModal } from '../Modals.vue';
import { useBooklet } from './BookletComposable';
import Hotkey from '../generic/Hotkey.vue';
import Tooltip from '../generic/Tooltip.vue';
import RenameSetVue from './modals/RenameSet.vue';

const { currentSet } = useBuilder();

const getNbBriqs = computed(() => {
    // Vue reactiveness, this is opt-in for performance.
    currentSet.value.usedByMaterial_;
    let used = 0;
    for (let mat in currentSet.value.usedByMaterial)
        used += currentSet.value.usedByMaterial[mat];
    return used;
});


const {
    shapeValidity,
    booklet,
    minimized,
} = useBooklet();

const canMintSet = computed(() => {
    return currentSet.value.getNbBriqs() > 0 && (!booklet.value || shapeValidity.value === 1)
})


let _clicked = false;
const connectWallet = () => {
    if (maybeStore.value)
        maybeStore.value.openWalletSelector()
    else if (!_clicked) {
        _clicked = true;
        walletInitComplete.then(() => maybeStore.value!.openWalletSelector());
    }
}

const { chainBriqs } = useBuilder();

const { activeInputButton, switchToState } = useBuilderInput();

const menuOpen = ref(false);
</script>

<style scoped>
.divider {
    @apply w-[1px] bg-grad-light h-[2.125rem];
}
.btn::before {
    @apply rounded-[0.375rem];
}
div.flex > div.flex > div.flex > button:not(.btn):not(.nostyle) {
    @apply w-10 h-10;
}
::v-deep(button.roundedButton)::before {
    @apply !rounded;
}

</style>

<template>
    <div class="mx-1 mt-1 sm:mx-2 sm:mt-2 flex flex-wrap pointer-events-none" v-if="!inputStore.hideInput">
        <div class="flex-1 basis-1 min-w-max flex justify-stretch lg:justify-start">
            <div class="flex flex-none items-center p-1 gap-1 border border-grad-light bg-grad-lightest rounded pointer-events-auto">
                <router-link :to="`/profile?tab=WIP`"><Btn no-background><i class="fa-solid fa-arrow-left"/></Btn></router-link>
                <Btn no-background @click="menuOpen = !menuOpen" :force-active="menuOpen"><i class="fa-solid fa-bars"/></Btn>
                <div class="divider"/>
                <div class="flex flex-none px-2 gap-2 items-baseline">
                    <Btn no-style class="font-medium hover:text-primary active:text-primary" @click="pushModal(RenameSetVue, { set: currentSet.id })">
                        {{ currentSet.name }}
                    </btn>
                </div>
                <div class="divider"/>
                <UndoRedo no-background secondary class="flex-none px-1"/>
                <div class="divider"/>
                <Btn no-background class="p-0" @click="pushModal(ShortcutModal)"><i class="text-lg far fa-circle-question"/></Btn>
                <Hotkey name="help" :data="{ key: '?', shift: true }" :handler="() => pushModal(ShortcutModal)"/>
            </div>
        </div>
        <div class="flex-1 basis-1 flex lg:justify-center">
            <div class="border border-grad-light bg-grad-lightest rounded flex gap-1 p-1 pointer-events-auto">
                <Btn no-background @click="switchToState('inspect')" tooltip="Select tool" :force-active="activeInputButton === 'select'"><i class="text-[1.1rem] far fa-mouse-pointer"/></Btn>
                <Btn no-background @click="switchToState('place')" tooltip="Place tool" :force-active="activeInputButton === 'place'"><i class="text-[1.1rem] far fa-cube"/></Btn>
                <Btn no-background @click="switchToState('paint')" tooltip="Paint tool" :force-active="activeInputButton === 'paint'"><i class="text-[1.1rem] far fa-paintbrush-fine"/></Btn>
                <Btn no-background @click="switchToState('erase')" tooltip="Erase tool" :force-active="activeInputButton === 'erase'"><i class="text-[1.1rem] far fa-eraser"/></Btn>
                <Hotkey name="group-1" :data="{ code: 'Digit1', onDown: true }" :handler="() => switchToState('inspect')"/>
                <Hotkey name="group-2" :data="{ code: 'Digit2', onDown: true }" :handler="() => switchToState('place')"/>
                <Hotkey name="group-3" :data="{ code: 'Digit3', onDown: true }" :handler="() => switchToState('paint')"/>
                <Hotkey name="group-4" :data="{ code: 'Digit4', onDown: true }" :handler="() => switchToState('erase')"/>
            </div>
        </div>
        <div class="flex-1 basis-1 flex lg:justify-end">
            <div v-if="booklet" class="rounded border-grad-light bg-grad-lightest border mr-2 flex justify-center items-center p-1 pointer-events-auto">
                <Btn no-background :force-active="!minimized" @click="minimized = !minimized"><i class="far fa-book-open"/></Btn>
            </div>
            <div class="flex items-stretch gap-1 p-1 border border-grad-light bg-grad-lightest rounded pointer-events-auto">
                <template v-if="maybeStore?.userWalletAddress">
                    <Tooltip :tooltip="`${ getNbBriqs } briqs used out of ${ chainBriqs?.getNbBriqs() } in wallet`">
                        <div class="flex items-center justify-left font-medium gap-2 pl-3 pr-4 cursor-help" :style="{ minWidth: `${getNbBriqs.toString().length * 0.6 + 5.7}rem`}">
                            <briqIcon width="0.9rem" class="inline-block"/>
                            {{ getNbBriqs }}/{{ chainBriqs?.getNbBriqs() }}
                        </div>
                    </Tooltip>
                    <div>
                        <MenuDropdown no-background icon class="text-xs">
                            <template #button><ProfileIcon width="1rem" height="1rem" class="inline-block"/></template>
                            <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="far fa-circle-user"/> My profile</Btn></router-link>
                            <Btn no-background class="justify-start" icon @click="maybeStore?.openWalletSelector()"><i class="far fa-address-card"/> Change Wallet</Btn>
                            <Btn no-background class="justify-start" icon @click="maybeStore?.disconnect()"><i class="far fa-power-off"/> Disconnect</Btn>
                        </MenuDropdown>
                    </div>
                    <NotificationsMenu/>
                    <Btn @click="pushModal(ExportSetVue, { setId: currentSet.id })" :disabled="!canMintSet">Mint</Btn>
                </template>
                <template v-else-if="!maybeStore?.userWalletAddress && maybeStore?._userWalletAddress">
                    <MenuDropdown no-background icon class="text-xs  py-0 px-1 roundedButton">
                        <template #button>
                            <div class="select-none z-10 rounded font-normal bg-primary bg-opacity-20 text-sm text-primary p-2">
                                <span class="hidden md:block">Wrong network, switch to mainnet</span>
                                <span class="md:hidden block">Switch to mainnet</span>
                            </div>
                            <ProfileIcon width="1rem" height="1rem" class="inline-block !mx-2"/>
                        </template>
                        <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                        <Btn no-background class="justify-start" icon @click="maybeStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                        <Btn no-background class="justify-start" icon @click="maybeStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                    </MenuDropdown>
                    <Btn disabled="true" id="mintbutton">Mint</Btn>
                </template>
                <template v-else>
                    <Btn class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <Btn disabled="true" id="mintbutton">Mint</Btn>
                </template>
            </div>
        </div>
    </div>
    <MenuBuilder :open="menuOpen" @close="menuOpen = false"/>
</template>
