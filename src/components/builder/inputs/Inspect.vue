<script setup lang="ts">
import BriqSwapModal from '../modals/BriqSwapModal.vue';
import { pushModal } from "../../Modals.vue";
import Hotkey from "../../generic/Hotkey.vue";
</script>

<template>
    <!-- Sidebar bit -->
    <div>
        <!--
        <template v-if="selection.selectedBriqs.length <= 3">
            <div  class="bg-base rounded-md px-2 py-1" v-for="briq of selection.selectedBriqs">
                <p class="text-sm tracking-tighter break-all">{{ briq?.id ?? "Fungible briq" }}</p>
                <Btn :disabled="!chainBriqs.getNbBriqs()" @click="openSwapModal(briq.temp_id)">Swap briq</Btn>
            </div>
        </template>
        <template v-else="">
            <p>TODO</p>
        </template>
        -->
        <div class="flex flex-col gap-1">
            <Btn @click="resetCamera">Reset Camera</Btn>
            <Btn class="leading-4" @click="centerCamera" :disabled="!selection.selectedBriqs.length">Center on<br />Selection</Btn>
            <Btn @click="selectAll">Select All</Btn>
            <Btn v-if="featureFlags.briq_copy_paste" :disabled="!selection.selectedBriqs.length" @click="copy">Copy</Btn>
            <Btn :disabled="!selection.selectedBriqs.length" @click="deleteBriqs">Delete</Btn>
            <Hotkey name="delete-1" :data="{ code: 'Backspace' }" :handler="() => deleteBriqs()"></Hotkey>
            <Hotkey name="delete-2" :data="{ code: 'Delete' }" :handler="() => deleteBriqs()"></Hotkey>
        </div>
    </div>
    <div v-if="fsm.selectionBox"
        class="bg-opacity-50 bg-white border-2 border-solid border-black fixed pointer-events-none"
        :style="{
            'left': `${Math.min(fsm.curX, fsm.startX)}px`,
            'top': `${Math.min(fsm.curY, fsm.startY)}px`,
            'width': `${Math.abs(fsm.curX - fsm.startX)}px`,
            'height': `${Math.abs(fsm.curY - fsm.startY)}px` }">
    </div>
    <!-- Follows the mouse -->
    <div v-if="fsm?.briq" class="fixed pointer-events-none" :style="{ 'left': `${fsm.curX+20}px`, 'top': `${fsm.curY+20}px` }">
        <div class="w-auto min-w-32 h-32 bg-base p-2 rounded-md shadow-md">
        <h4 v-if="fsm?.briq?.id">briq: <span class="tracking-tighter">{{ fsm?.briq?.id }}</span></h4>
        <h4 v-else="">Fungible briq</h4>
        <p>Color: {{ fsm.briq.color }}</p>
        <p>Material: {{ mapMat(fsm.briq.material) }}</p>
        </div>
    </div>
</template>

<style scoped>
button {
    @apply px-2 py-0;
}
</style>


<script lang="ts">
import { builderInputFsm } from "../../../builder/inputs/BuilderInput"
import type { Briq } from "../../../builder/Briq";
import { resetCamera } from '../../../builder/graphics/Builder'

import { dispatchBuilderAction } from "../../../builder/graphics/Dispatch";
import { inputStore } from "../../../builder/inputs/InputStore";

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["chainBriqs", "messages", "featureFlags"],
    data() {
        return {
            selection: inputStore.selectionMgr,
        };
    },
    computed: {
        fsm() {
            return builderInputFsm.state.gui;
        },
    },
    methods: {
        resetCamera,
        centerCamera() {
            dispatchBuilderAction("set_camera_target", { target: [this.fsm.focusPos.x, this.fsm.focusPos.y, this.fsm.focusPos.z] });
        },
        copy() {
            builderInputFsm.switchTo("copy_paste");
        },
        async deleteBriqs() {
            await this.$store.dispatch("builderData/place_briqs", this.selection.selectedBriqs.map(briq => ({ pos: briq.position })));
            this.messages.pushMessage("briqs deleted");
        },
        selectAll() {
            let briqs = [] as Briq[];
            this.$store.state.builderData.currentSet.forEach((briq: Briq) => { briqs.push(briq) });
            this.selection.select(briqs);
        },
        move(obj: { [key in 'x' | 'y' | 'z']?: number})
        {
            try {
                this.$store.dispatch("builderData/move_briqs", { delta: obj, briqs: this.selection.selectedBriqs });
            } catch(err) {
                console.log(err);
                this.messages.pushMessage("Cannot move set, briqs would be out of bounds");
            }
        },
        moveX(delta: number) { this.move({ x: delta }); },
        moveY(delta: number) { this.move({ y: delta }); },
        moveZ(delta: number) { this.move({ z: delta }); },
        mapMat(mat: number) {
            return "standard";
        },
        async openSwapModal(briqId: string) {
            let choice = await pushModal(BriqSwapModal, {
                exclude: [briqId],
            })
            if (choice?.briq?.id)
                await this.$store.dispatch("builderData/swap_briqs", [[briqId, choice.briq.id]]);
        },
    },
})
</script>
