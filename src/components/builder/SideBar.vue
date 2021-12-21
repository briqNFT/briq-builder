<script setup lang="ts">
import Button from '../generic/Button.vue';
import InputComp from './InputComp.vue'
</script>

<template>
    <div id="sideBar" class="flex flex-nowrap flex-col mx-4 md:py-20 py-12 absolute left-0 top-0 max-w-full max-h-screen justify-top pointer-events-none">
        <div class="my-2 md:my-4 md:grid md:grid-rows-2 md:grid-cols-2 flex flex-row gap-1 w-24 pointer-events-auto">
            <Button tooltip="In 'Place' mode, left-click to place and right-click to delete briqs."
                @click="inputStore.currentInput = 'place'" :disabled="inputStore.currentInput === 'place'"><i class="fas fa-cube"/></Button>
            <Button tooltip="In 'Paint' mode, left-click to repaint briqs, right-click to sample the briq color."
                @click="inputStore.currentInput = 'paint'" :disabled="inputStore.currentInput === 'paint'"><i class="fas fa-paint-brush"/></Button>
            <Button tooltip="In 'Erase' mode, left-click to delete briqs."
                @click="inputStore.currentInput = 'erase'" :disabled="inputStore.currentInput === 'erase'"><i class="far fa-trash-alt"/></Button>
            <Button tooltip="In 'Select' mode, you can select briqs and swap them for others."
                @click="inputStore.currentInput = 'inspect'" :disabled="inputStore.currentInput === 'inspect'"><i class="fas fa-mouse-pointer"></i></Button>
            <Button tooltip="Use 'Camera' mode to adjust the camera for e.g. screenshots."
                @click="inputStore.currentInput = 'camera'" :disabled="inputStore.currentInput === 'camera'"><i class="fas fa-video"/></Button>
            <Button tooltip="Use 'Move' mode to move all briqs in the set."
                @click="inputStore.currentInput = 'move'" :disabled="inputStore.currentInput === 'move'"><i class="fas fa-arrows-alt"></i></Button>
        </div>
        <div class="flex md:flex-col max-w-full overflow-auto flex-row justify-stretch align-stretch content-stretch pointer-events-auto">
            <InputComp/>
        </div>
        <p class="md:text-center font-normal drop-shadow-md pointer-events-auto" style="text-shadow: 0 0 2px rgba(0, 0, 0, 0.4)">{{ getNbBriqs }}</p>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
            inputStore
        };
    },
    computed: {
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
