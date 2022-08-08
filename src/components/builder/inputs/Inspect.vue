<script setup lang="ts">
import BriqSwapModal from '../modals/BriqSwapModal.vue';
import { pushModal } from '../../Modals.vue';
import Hotkey from '../../generic/Hotkey.vue';
</script>

<template>
    <!-- Sidebar bit -->
    <div>
        <!--
        <template v-if="selection.selectedBriqs.length <= 3">
            <div  class="bg-grad-lightest rounded px-2 py-1" v-for="briq of selection.selectedBriqs">
                <p class="text-sm tracking-tighter break-all">{{ briq?.id ?? "Fungible briq" }}</p>
                <Btn :disabled="!chainBriqs.getNbBriqs()" @click="openSwapModal(briq.temp_id)">Swap briq</Btn>
            </div>
        </template>
        <template v-else="">
            <p>TODO</p>
        </template>
        -->
        <h4 class="bg-primary rounded px-2 py-1 mt-4 mb-1 text-center font-semibold">Selection</h4>
        <div class="flex flex-col gap-1">
            <div class="grid grid-cols-2 gap-0.5">
                <CheckboxBtn
                    v-if="editMode"
                    :enabled="inputStore.showMoveGizmo"
                    @enable="(enabled: boolean) => { inputStore.showMoveGizmo = enabled; }"
                    tooltip="When active, show the 'movement' gizmo.">
                    <template #icon><i class="fas fa-arrows-alt"/></template>
                </CheckboxBtn>
                <CheckboxBtn
                    v-if="editMode"
                    :enabled="inputStore.showRotateGizmo"
                    @enable="(enabled: boolean) => { inputStore.showRotateGizmo = enabled; }"
                    tooltip="When active, show the 'rotation' gizmo.">
                    <template #icon><i class="fas fa-sync"/></template>
                </CheckboxBtn>

                <Btn
                    :disabled="inputStore.defaultSelectionMethod === 'BOX'"
                    @click="inputStore.defaultSelectionMethod = 'BOX'"
                    tooltip="Shift-click selects briqs within a box on the screen. Use shift+alt for briq-aware selection.">
                    <i class="fas fa-vector-square"/>
                </Btn>
                <Btn
                    :disabled="inputStore.defaultSelectionMethod !== 'BOX'"
                    @click="inputStore.defaultSelectionMethod = 'VOXEL'"
                    tooltip="Shift-click selects briqs in a briq-aware mode. Use shift+alt for box selection.">
                    <i class="fas fa-cubes"/>
                </Btn>
            </div>
            <Btn @click="selectAll">Select All</Btn>
            <Btn @click="centerCamera" :disabled="!selection.selectedBriqs.length" class="leading-4">
                Center on<br>Selection
            </Btn>
            <Btn
                v-if="editMode"
                :disabled="!selection.selectedBriqs.length"
                @click="copy"
                tooltip="Copy selected briqs. Hotkey: Ctrl + C">
                Copy
            </Btn>
            <Btn
                v-if="editMode"
                :disabled="!selection.selectedBriqs.length"
                @click="deleteBriqs"
                tooltip="Delete selected briqs. Hotkey: delete/backspace">
                Delete
            </Btn>
            <Hotkey
                v-if="editMode"
                name="delete-1"
                :data="{ code: 'Backspace' }"
                :handler="() => deleteBriqs()"/>
            <Hotkey v-if="editMode" name="delete-2" :data="{ code: 'Delete' }" :handler="() => deleteBriqs()"/>
        </div>
        <h4 v-if="editMode" class="bg-primary rounded px-2 py-1 mt-4 mb-1 text-center font-semibold">Move / Copy</h4>
        <div v-if="editMode" class="flex flex-col gap-1 my-2">
            <CheckboxBtn
                tooltip="Overwrite any existing briq when moving or pasting briqs. If off, existing briqs will instead be kept."
                :enabled="overlayMode"
                @click="overlayMode = !overlayMode">
                Overwrite
            </CheckboxBtn>
        </div>
    </div>
    <!-- Follows the mouse -->
    <div
        v-if="fsm?.briq"
        class="fixed pointer-events-none"
        :style="{ left: `${fsm.curX + 20}px`, top: `${fsm.curY + 20}px` }">
        <div class="w-auto min-w-32 h-32 bg-grad-lightest p-2 rounded shadow-md">
            <h4 v-if="fsm?.briq?.id">
                briq: <span class="tracking-tighter">{{ fsm?.briq?.id }}</span>
            </h4>
            <h4 v-else="">Fungible briq</h4>
            <p>Color: {{ fsm.briq.color }}</p>
            <p>Material: {{ mapMat(fsm.briq.material) }}</p>
            <p>Position: {{ JSON.stringify(fsm.briq.position) }}</p>
        </div>
    </div>
</template>

<style scoped>
button {
    @apply px-2 py-0;
}
</style>

<script lang="ts">
import { builderInputFsm } from '../../../builder/inputs/BuilderInput';
import type { Briq } from '../../../builder/Briq';
import { setsManager } from '@/builder/SetsManager';

import { dispatchBuilderAction } from '../../../builder/graphics/Dispatch';
import { inputStore } from '../../../builder/inputs/InputStore';
import { getNameFromMaterial } from '@/Conf';

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ['chainBriqs', 'messages', 'featureFlags'],
    data() {
        return {
            selection: inputStore.selectionMgr,
            inputStore,
        };
    },
    computed: {
        editMode() {
            return (
                setsManager.getInfo(this.$store.state.builderData.currentSet.id)?.status !== 'ONCHAIN_LOADED'
            );
        },
        fsm() {
            return builderInputFsm.state.gui;
        },
        overlayMode: {
            get() {
                return inputStore.briqOverlayMode === 'OVERWRITE';
            },
            set(v: boolean) {
                inputStore.briqOverlayMode = v ? 'OVERWRITE' : 'KEEP';
            },
        },
    },
    methods: {
        centerCamera() {
            dispatchBuilderAction('set_camera_target', {
                target: [this.fsm.focusPos.x, this.fsm.focusPos.y, this.fsm.focusPos.z],
            });
        },
        copy() {
            builderInputFsm.switchTo('copy_paste');
        },
        async deleteBriqs() {
            await this.$store.dispatch(
                'builderData/place_briqs',
                this.selection.selectedBriqs.map((briq) => ({ pos: briq.position })),
            );
            this.messages.pushMessage('briqs deleted');
        },
        selectAll() {
            let briqs = [] as Briq[];
            this.$store.state.builderData.currentSet.forEach((briq: Briq) => {
                briqs.push(briq);
            });
            this.selection.select(briqs);
        },
        move(obj: { [key in 'x' | 'y' | 'z']?: number }) {
            try {
                this.$store.dispatch('builderData/move_briqs', { delta: obj, briqs: this.selection.selectedBriqs });
            } catch (err) {
                console.log(err);
                this.messages.pushMessage('Cannot move set, briqs would be out of bounds');
            }
        },
        moveX(delta: number) {
            this.move({ x: delta });
        },
        moveY(delta: number) {
            this.move({ y: delta });
        },
        moveZ(delta: number) {
            this.move({ z: delta });
        },
        mapMat(mat: string) {
            return getNameFromMaterial(mat);
        },
        async openSwapModal(briqId: string) {
            let choice = await pushModal(BriqSwapModal, {
                exclude: [briqId],
            });
            if (choice?.briq?.id)
                await this.$store.dispatch('builderData/swap_briqs', [[briqId, choice.briq.id]]);
        },
    },
});
</script>
