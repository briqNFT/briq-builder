<script setup lang="ts">
import BriqSwapModal from '../modals/BriqSwapModal.vue';
import { pushModal } from "../../Modals.vue";
import { featureFlags } from "../../../FeatureFlags";
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
        <div v-if="showMove" class="font-mono text-sm grid grid-cols-2 gap-1">
            <Btn @click="moveX(1)">X+1</Btn>
            <Btn @click="moveX(-1)">X-1</Btn>
            <Btn @click="moveY(1)">Y+1</Btn>
            <Btn @click="moveY(-1)">Y-1</Btn>
            <Btn @click="moveZ(1)">Z+1</Btn>
            <Btn @click="moveZ(-1)">Z-1</Btn>
        </div>
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

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["chainBriqs", "messages"],
    data() {
        return {
            fsm: builderInputFsm.state.gui,
            selection: builderInputFsm.store.selectionMgr,
        };
    },
    computed: {
        showMove() {
            return featureFlags.briq_select_movement;
        }
    },
    methods: {
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
