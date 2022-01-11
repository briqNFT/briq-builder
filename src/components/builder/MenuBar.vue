<script setup lang="ts">
import UndoRedo from './UndoRedo.vue'
import SetBrowser from './set_browser/SetBrowser.vue'

import HistoryLog from './modals/HistoryLog.vue'
</script>

<template>
    <div id="menuBar" class="px-4 py-2 md:py-4 absolute top-0 w-screen flex flex-nowrap pointer-events-none">
        <div v-if="!inputStore.forceInput" class="flex flex-nowrap justify-start align-start child-events">
            <UndoRedo/>
            <Btn tooltip="Open the undo/redo history log" class="mx-1" @click="setModal(HistoryLog)"><i class="fas fa-history"></i></Btn>
            <Btn tooltip="Browse on-chain sets" class="mx-1" @click="setBrowser = !setBrowser"><i class="far fa-folder"></i> Sets</Btn>
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
.child-events > * {
    @apply pointer-events-auto;
}
#menuBar > * {
    @apply flex-auto;
}
</style>