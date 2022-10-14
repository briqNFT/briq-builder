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
import CameraFlyout from './CameraFlyout.vue';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ExportSetVue from './modals/ExportSet.vue';
import { pushModal } from '../Modals.vue';
import { useBooklet } from './BookletComposable';
import Hotkey from '../generic/Hotkey.vue';

const { currentSet } = useBuilder();

const getNbBriqs = computed(() => {
    // Vue reactiveness, this is opt-in for performance.
    currentSet.value.usedByMaterial_;
    let used = 0;
    for (let mat in currentSet.value.usedByMaterial)
        used += currentSet.value.usedByMaterial[mat];

    let selected = '';
    if (['inspect', 'inspect_va', 'inspect_box', 'drag', 'rotate', 'copy_paste'].indexOf(
        inputStore.currentInput,
    ) !== -1 && inputStore.selectionMgr.selectedBriqs.length > 0)
        selected = ` (${inputStore.selectionMgr.selectedBriqs.length} selected)`;
    return `${used} briqs${selected}`;
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

const cameraButton = ref(null as unknown as { button: HTMLButtonElement });
const cameraFlyout = ref(null as unknown as HTMLElement);
const vPositionToCamera = {
    mounted: (el: HTMLElement) => {
        cameraFlyout.value = el;
        const pos = cameraButton.value.button.getBoundingClientRect();
        el.style.top = `${pos.bottom}px`;
        el.style.left = `${pos.left}px`;
    },
}

const menuOpen = ref(false);

let willCloseCameraFlyout = undefined as undefined | number;
const _showCameraFlyout = ref(false);
const showCameraFlyout = () => {
    _showCameraFlyout.value = true;
    if (willCloseCameraFlyout)
        clearTimeout(willCloseCameraFlyout);
    willCloseCameraFlyout = undefined;
}

const hideCameraFlyout = () => {
    willCloseCameraFlyout = setTimeout(() => {
        if (willCloseCameraFlyout)
            _showCameraFlyout.value = false;
    }, 250) as unknown as number;
};

</script>

<style scoped>
.divider {
    @apply w-[1px] bg-grad-light h-[24px];
}
</style>

<template>
    <div class="mx-1 mt-1 sm:mx-4 sm:mt-4 flex flex-wrap" v-if="!inputStore.hideInput">
        <div class="flex-1 basis-1 min-w-max flex justify-stretch lg:justify-start">
            <div class="flex flex-none items-center px-2 py-1 gap-2 border border-grad-light bg-grad-lightest rounded-md">
                <router-link :to="{ name: 'Profile' }"><Btn no-background><i class="fa-solid fa-arrow-left"/></Btn></router-link>
                <Btn no-background @click="menuOpen = !menuOpen" :force-active="menuOpen"><i class="fa-solid fa-bars"/></Btn>
                <div class="divider"/>
                <div class="flex flex-none px-2 gap-2 items-baseline">
                    <p class="font-semibold">{{ currentSet.name }}</p>
                    <p class="text-grad-dark">{{ getNbBriqs }}</p>
                </div>
                <div class="divider"/>
                <UndoRedo no-background secondary class="flex-none px-1"/>
                <div class="divider"/>
                <Btn no-background @click="pushModal(ShortcutModal)"><i class="far fa-keyboard"/></Btn>
                <Hotkey name="help" :data="{ key: '?', shift: true }" :handler="() => pushModal(ShortcutModal)"/>
            </div>
        </div>
        <div class="flex-1 basis-1 flex lg:justify-center">
            <div class="border bg-grad-lightest rounded-md flex gap-1 px-2 py-1">
                <Btn no-background @click="switchToState('inspect')" tooltip="Select tool - click to select, right-click to deselect, shift-click selects many." :force-active="activeInputButton === 'select'"><i class="fas fa-mouse-pointer"/></Btn>
                <Btn no-background @click="switchToState('place')" tooltip="Place tool - click to place briq, right-click to remove, shift-click to place many" :force-active="activeInputButton === 'place'"><i class="fas fa-cube"/></Btn>
                <Btn no-background @click="switchToState('paint')" tooltip="Paint tool - click to paint, right-click to sample, shift-click to paint many" :force-active="activeInputButton === 'paint'"><i class="fas fa-paint-roller"/></Btn>
                <Btn no-background @click="switchToState('erase')" tooltip="Erase tool - click to erase, shift-click to erase many" :force-active="activeInputButton === 'erase'"><i class="fas fa-eraser"/></Btn>
                <Btn no-background @click="switchToState('camera')" tooltip="Camera tool" :force-active="activeInputButton === 'camera'" ref="cameraButton">
                    <i class="fas fa-video"/>
                </Btn>
                <Hotkey name="group-1" :data="{ code: 'Digit1', onDown: true }" :handler="() => switchToState('inspect')"/>
                <Hotkey name="group-2" :data="{ code: 'Digit2', onDown: true }" :handler="() => switchToState('place')"/>
                <Hotkey name="group-3" :data="{ code: 'Digit3', onDown: true }" :handler="() => switchToState('paint')"/>
                <Hotkey name="group-4" :data="{ code: 'Digit4', onDown: true }" :handler="() => switchToState('erase')"/>
                <Hotkey name="group-5" :data="{ code: 'Digit5', onDown: true }" :handler="() => switchToState('camera')"/>
            </div>
        </div>
        <div class="flex-1 basis-1 flex lg:justify-end">
            <div v-if="booklet" class="rounded-md bg-grad-lightest border mr-1 flex justify-center items-center p-1">
                <Btn no-background :force-active="!minimized" @click="minimized = !minimized"><i class="fa-solid fa-book-open"/></Btn>
            </div>
            <div class="flex items-stretch gap-1 px-2 py-1 border bg-grad-lightest rounded-md">
                <template v-if="maybeStore?.userWalletAddress">
                    <div class="flex items-center justify-center font-medium gap-2 px-2">
                        <briqIcon class="inline-block"/> {{ chainBriqs?.getNbBriqs() }}
                    </div>
                    <div>
                        <MenuDropdown no-background icon class="text-xs">
                            <template #button><ProfileIcon width="1rem" height="1rem" class="inline-block"/></template>
                            <router-link :to="{ name: 'Profile' }"><Btn class="w-full justify-start" no-background icon><i class="fa-regular fa-circle-user"/> My profile</Btn></router-link>
                            <Btn no-background class="justify-start" icon @click="maybeStore?.openWalletSelector()"><i class="fa-regular fa-id-card"/> Change Wallet</Btn>
                            <Btn no-background class="justify-start" icon @click="maybeStore?.disconnect()"><i class="fa-solid fa-power-off"/> Disconnect</Btn>
                        </MenuDropdown>
                    </div>
                    <NotificationsMenu/>
                    <Btn @click="pushModal(ExportSetVue, { setId: currentSet.id })" :disabled="!canMintSet">Mint</Btn>
                </template>
                <template v-else>
                    <Btn class="flex-none" @click="connectWallet"><span class="px-2">Connect</span></Btn>
                    <Btn disabled="true">Mint</Btn>
                </template>
            </div>
        </div>
    </div>
    <MenuBuilder :open="menuOpen" @close="menuOpen = false"/>
    <CameraFlyout
        v-if="_showCameraFlyout"
        v-position-to-camera
        ref="cameraFlyout"
        class="!absolute top-0 w-max mt-2"
        @pointerenter="showCameraFlyout"
        @pointerleave="hideCameraFlyout"/>
</template>
