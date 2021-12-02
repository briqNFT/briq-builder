<script setup lang="ts">
import UndoRedo from './UndoRedo.vue'
import Button from '../generic/Button.vue'

import SetBrowser from './set_browser/SetBrowser.vue'

import HistoryLog from './modals/HistoryLog.vue'
</script>

<template>
    <div id="menuBar" class="px-4 py-2 absolute top-1 w-screen flex flex-nowrap">
        <div class="flex flex-nowrap justify-start align-start">
            <UndoRedo/>
            <Button tooltip="Open the undo/redo history log" class="mx-1" @click="setModal(HistoryLog)"><i class="fas fa-history"></i></Button>
            <Button tooltip="Browse on-chain sets" class="mx-1" @click="setBrowser = !setBrowser"><i class="far fa-folder"></i></Button>
            <teleport to="#app">
                <SetBrowser asModal="true" @close="setBrowser=false" v-if="setBrowser"/>
            </teleport>
        </div>
    </div>
</template>

<script lang="ts">
import { setModal } from '../MiddleModal.vue'

import { inputStore } from '../../builder/inputs/InputStore';

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
#menuBar > * {
    @apply flex-auto;
}
</style>