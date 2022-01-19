<script setup lang="ts">
import BriqSwapModal from '../modals/BriqSwapModal.vue';
import { pushModal } from "../../Modals.vue";
</script>

<template>
    <!-- Sidebar bit -->
    <div class="alternate-buttons">
        <template v-if="selection.selectedBriqs.length <= 2">
            <div  class="bg-briq dark:bg-briq-darker rounded-md px-2 py-1" v-for="briqId of selection.selectedBriqs">
                <p class="text-sm tracking-tighter break-all">{{ getBriqIdentifier(selection.set?.briqsDB.get(briqId).id) }}</p>
                <Btn :disabled="briqsDB.briqs.size === 0" @click="openSwapModal(briqId)">Swap briq</Btn>
            </div>
        </template>
        <template v-else="">
            <p>TODO</p>
        </template>
    </div>
    <!-- Follows the mouse -->
    <div v-if="fsm?.briq" class="fixed pointer-events-none" :style="{ 'left': `${fsm.curX+20}px`, 'top': `${fsm.curY+20}px` }">
        <div class="w-auto min-w-32 h-32 bg-briq dark:bg-briq-darker p-2 rounded-md shadow-md">
        <h4>Briq: <span class="tracking-tighter">{{ getBriqIdentifier(fsm?.briq?.id ?? '') }}</span></h4>
        <p>Color: {{ fsm.briq.color }}</p>
        <p>Material: {{ mapMat(fsm.briq.material) }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import { builderInputFsm } from "../../../builder/inputs/BuilderInput"

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["chainBriqs"],
    data() {
        return {
            fsm: builderInputFsm.state.gui,
            selection: builderInputFsm.store.selectionMgr,
            briqsDB: this.chainBriqs.DB,
        };
    },
    methods: {
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
        getBriqIdentifier(id: string) {
            if (this.briqsDB.briqs.has(id))
                return id;
            return "Temporary briq";
        }
    },
})
</script>
