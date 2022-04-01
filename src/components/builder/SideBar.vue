<script setup lang="ts">
import Button from '../generic/Button.vue';
import InputComp from './InputComp.vue'
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import Tooltip from '../generic/Tooltip.vue';
</script>

<template>
    <div id="sideBar" class="flex flex-nowrap flex-col mx-4 md:py-20 py-12 absolute left-0 top-0 max-w-full max-h-screen justify-top pointer-events-none">
        <div v-if="!inputStore.forceInput" class="my-2 md:my-4 md:grid md:grid-rows-2 md:grid-cols-2 flex flex-row gap-1 w-24 pointer-events-auto">
            <Btn v-if="editMode" tooltip="In 'Place' mode, left-click to place briqs, right-click to delete, hold SHIFT to place multiple briqs."
                @click="builderInputFsm.switchTo('place')" :disabled="isPlacing"><i class="fas fa-cube"/></Btn>
            <Btn v-if="editMode" tooltip="In 'Paint' mode, left-click to repaint briqs, right-click to sample the briq color, hold SHIFT to paint multiple briqs."
                @click="builderInputFsm.switchTo('paint')" :disabled="isPainting"><i class="fas fa-paint-brush"/></Btn>
            <Btn v-if="editMode" tooltip="In 'Erase' mode, left-click to delete briqs, hold SHIFT to delete multiple briqs."
                @click="builderInputFsm.switchTo('erase')" :disabled="isErasing"><i class="far fa-trash-alt"/></Btn>
            <Btn v-if="editMode" tooltip="'Select' mode can be used to move or inspect briqs. Left-click to select, right-click to unselect."
                @click="builderInputFsm.switchTo('inspect')" :disabled="isInspecting"><i class="fas fa-mouse-pointer"></i></Btn>
        </div>
        <div id="inputComp" class="flex md:flex-col max-w-full overflow-auto flex-row justify-stretch align-stretch content-stretch pointer-events-auto">
            <InputComp/>
        </div>
        <!-- Repeated 3 times for contrast -->
        <div v-if="editMode" position="relative w-full">
            <p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-none select-none mix-blend-saturation">{{ getNbBriqs }}</p>
            <p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-none select-none mix-blend-difference">{{ getNbBriqs }}</p>
            <Tooltip tooltip="This gives you the # of briqs used in the set, out of the total available briqs."><p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-auto select-none mix-blend-overlay">
                {{ getNbBriqs }}</p></Tooltip>
        </div>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';
import { setsManager } from '../../builder/SetsManager';

import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
        };
    },
    inject: ["chainBriqs"],
    computed: {
        inputStore() {
            return inputStore;
        },
        builderInputFsm() {
            return builderInputFsm;
        },
        editMode() {
            return !inputStore.forceInput && setsManager.getInfo(this.$store.state.builderData.currentSet.id)?.status !== 'ONCHAIN_LOADED';
        },
        getNbBriqs() {
            if (this.chainBriqs.status === 'ERROR')
                return 'Error loading briqs';
            if (this.chainBriqs.status === 'NOT_LOADED')
                return 'briqs not loaded';
            let total = this.chainBriqs.getNbBriqs();
            // Vue reactiveness, this is opt-in for performance.
            this.$store.state.builderData.currentSet.usedByMaterial_;
            let used = 0;
            for (let mat in this.$store.state.builderData.currentSet.usedByMaterial)
                used += this.$store.state.builderData.currentSet.usedByMaterial[mat];
            return `${used}/${total} briqs used`;
        },
        isPlacing() {
            return inputStore.currentInput.indexOf('place') !== -1
        },
        isPainting() {
            return inputStore.currentInput.indexOf('paint') !== -1
        },
        isErasing() {
            return inputStore.currentInput.indexOf('erase') !== -1
        },
        isInspecting() {
            return ["inspect", "inspect_va", "inspect_box", "drag", "rotate", "copy_paste"].indexOf(inputStore.currentInput) !== -1;
        }
    }
})
</script>

<style scoped>
</style>
