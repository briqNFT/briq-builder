<script setup lang="ts">
import Button from '../generic/Button.vue';
import InputComp from './InputComp.vue'
</script>

<template>
    <div id="sideBar" class="flex flex-nowrap flex-col px-5 py-20 absolute left-0 top-0 h-full justify-top">
        <div class="my-2 flex flex-col">
            <Button class="my-0.5" tooltip="In 'Place' mode, left-click to place and right-click to delete briqs."
                @click="inputStore.currentInput = 'place'" :disabled="inputStore.currentInput === 'place'">Place</Button>
            <Button class="my-0.5" tooltip="In 'Paint' mode, left-click to repaint briqs."
                @click="inputStore.currentInput = 'paint'" :disabled="inputStore.currentInput === 'paint'">Paint</Button>
            <Button class="my-0.5" tooltip="In 'Erase' mode, left-click to delete briqs."
                @click="inputStore.currentInput = 'erase'" :disabled="inputStore.currentInput === 'erase'">Erase</Button>
            <Button class="my-0.5" tooltip="In 'Inspect' mode, left-click to inspect briqs."
                @click="inputStore.currentInput = 'inspect'" :disabled="inputStore.currentInput === 'inspect'">Inspect</Button>
        </div>
        <InputComp/>
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
