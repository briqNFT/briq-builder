<script setup lang="ts">
import Settings from '../Tools/Settings.vue'
import UndoRedo from '../Tools/UndoRedo.vue'
import Button from '../generic/Button.vue'

import SetBrowser from './set_browser/SetBrowser.vue'

import HistoryLog from './modals/HistoryLog.vue'
</script>

<template>
    <div id="menuBar">
        <div class="flex flex-nowrap justify-start align-start">
            <UndoRedo/>
            <Button @click="setModal(HistoryLog)">History</Button>
            <Button @click="setBrowser = !setBrowser">Browse</Button>
            <teleport to="#app">
                <SetBrowser asModal="true" @close="setBrowser=false" v-if="setBrowser"/>
            </teleport>
        </div>
        <div class="flex flex-nowrap justify-center align-start">
            <Button tooltip="In 'Place' mode, left-click to place and right-click to delete briqs."
                @click="inputStore.currentInput = 'place'" :disabled="inputStore.currentInput === 'place'">Place</Button>
            <Button tooltip="In 'Erase' mode, left-click to delete briqs."
                @click="inputStore.currentInput = 'erase'" :disabled="inputStore.currentInput === 'erase'">Erase</Button>
            <Button tooltip="" disabled="true">Paint</Button>
        </div>
        <div class="flex flex-nowrap justify-end align-start">
            <Settings/>
        </div>
    </div>
</template>

<script lang="ts">
import { setModal } from '../MiddleModal.vue'

import { PlacerInput } from '../../builder/inputs/Placer'
import { EraserInput } from '../../builder/inputs/Eraser'

import { reactive } from 'vue';

export var inputStore = reactive({
    inputMap: {
        "place": PlacerInput,
        "erase": EraserInput,
    },
    currentInput: "place",
});

import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
            setBrowser: false,
            inputStore
        };
    },
    methods: {
        setModal: setModal
    }
})
</script>

<style>
#menuBar {
    position: absolute;
    top: 1rem;
    width: 100vw;
    padding: 0 5rem 0 5rem;
    @apply flex flex-nowrap;
}
#menuBar > * {
    @apply flex-auto;
}
</style>