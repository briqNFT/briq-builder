<script setup lang="ts">
import Button from '../generic/Button.vue';
import InputComp from './InputComp.vue'
</script>

<template>
    <div id="sideBar" class="flex flex-nowrap flex-col mx-4 md:py-20 py-12 absolute left-0 top-0 max-w-full max-h-screen justify-top pointer-events-none">
        <div v-if="!inputStore.forceInput" class="my-2 md:my-4 md:grid md:grid-rows-2 md:grid-cols-2 flex flex-row gap-1 w-24 pointer-events-auto">
            <Btn v-if="editMode" tooltip="In 'Place' mode, left-click to place and right-click to delete briqs."
                @click="inputStore.currentInput = 'place'" :disabled="inputStore.currentInput === 'place'"><i class="fas fa-cube"/></Btn>
            <Btn v-if="editMode" tooltip="In 'Paint' mode, left-click to repaint briqs, right-click to sample the briq color."
                @click="inputStore.currentInput = 'paint'" :disabled="inputStore.currentInput === 'paint'"><i class="fas fa-paint-brush"/></Btn>
            <Btn v-if="editMode" tooltip="In 'Erase' mode, left-click to delete briqs."
                @click="inputStore.currentInput = 'erase'" :disabled="inputStore.currentInput === 'erase'"><i class="far fa-trash-alt"/></Btn>
            <Btn v-if="editMode" tooltip="In 'Select' mode, you can select briqs and swap them for others."
                @click="inputStore.currentInput = 'inspect'" :disabled="inputStore.currentInput === 'inspect'"><i class="fas fa-mouse-pointer"></i></Btn>
            <Btn tooltip="Use 'Camera' mode to adjust the camera for e.g. screenshots."
                @click="inputStore.currentInput = 'camera'" :disabled="inputStore.currentInput === 'camera'"><i class="fas fa-video"/></Btn>
            <Btn v-if="editMode" tooltip="Use 'Move' mode to move all briqs in the set."
                @click="inputStore.currentInput = 'move'" :disabled="inputStore.currentInput === 'move'"><i class="fas fa-arrows-alt"></i></Btn>
        </div>
        <div id="inputComp" class="flex md:flex-col max-w-full overflow-auto flex-row justify-stretch align-stretch content-stretch pointer-events-auto">
            <InputComp/>
        </div>
        <!-- Repeated 3 times for contrast -->
        <div position="relative w-full">
            <p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-auto mix-blend-saturation">{{ getNbBriqs }}</p>
            <p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-auto mix-blend-difference">{{ getNbBriqs }}</p>
            <p class="absolute md:text-center md:w-full font-normal drop-shadow-md pointer-events-auto mix-blend-overlay">{{ getNbBriqs }}</p>
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
            inputStore
        };
    },
    computed: {
        editMode() {
            return !inputStore.forceInput && setsManager.getInfo(this.$store.state.builderData.currentSet.id)?.status !== 'ONCHAIN_LOADED';
        },
        getNbBriqs() {
            let total = 0;
            this.$store.state.builderData.briqsDB.briqs.forEach(x => total += +(!x.partOfSet()));
            if (!total)
                return '0 briqs left';
            for (let mat in this.$store.state.builderData.currentSet.usedByMaterial)
                total -= this.$store.state.builderData.currentSet.usedByMaterial[mat];
            if (total === 1)
                return '1 briq left';
            return total + ' briqs left';
        }
    }
})
</script>

<style scoped>
</style>
