<script setup lang="ts">
import Button from '../generic/Button.vue';
import InputComp from './InputComp.vue'
</script>

<template>
    <div id="sideBar" class="flex flex-nowrap flex-col mx-4 my-20 absolute left-0 top-0 max-w-full justify-top">
        <div class="my-4 md:grid md:grid-rows-2 md:grid-cols-2 flex flex-row gap-1">
            <Button class="my-0.5" tooltip="In 'Place' mode, left-click to place and right-click to delete briqs."
                @click="inputStore.currentInput = 'place'" :disabled="inputStore.currentInput === 'place'"><i class="fas fa-cube"/></Button>
            <Button class="my-0.5" tooltip="In 'Paint' mode, left-click to repaint briqs."
                @click="inputStore.currentInput = 'paint'" :disabled="inputStore.currentInput === 'paint'"><i class="fas fa-paint-brush"/></Button>
            <Button class="my-0.5" tooltip="In 'Erase' mode, left-click to delete briqs."
                @click="inputStore.currentInput = 'erase'" :disabled="inputStore.currentInput === 'erase'"><i class="fas fa-backspace"/></Button>
            <Button class="my-0.5" tooltip="In 'Inspect' mode, left-click to inspect briqs."
                @click="inputStore.currentInput = 'inspect'" :disabled="inputStore.currentInput === 'inspect'"><i class="fas fa-search-plus"/></Button>
        </div>
        <div class="flex md:flex-col max-w-full overflow-scroll flex-row justify-stretch align-stretch content-stretch">
            <InputComp/>
        </div>
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
    }
})
</script>

<style scoped>
</style>
