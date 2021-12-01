<script setup lang="ts">
import UndoRedo from '../Tools/UndoRedo.vue'
import Button from '../generic/Button.vue'

import SetBrowser from './set_browser/SetBrowser.vue'

import HistoryLog from './modals/HistoryLog.vue'
</script>

<template>
    <div id="menuBar" class="px-4 py-2 absolute top-1 w-screen flex flex-nowrap">
        <div class="flex flex-nowrap justify-start align-start">
            <UndoRedo/>
            <Button class="mx-1" @click="setModal(HistoryLog)">History</Button>
            <Button class="mx-1" @click="setBrowser = !setBrowser">Browse</Button>
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