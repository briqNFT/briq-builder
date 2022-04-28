<script setup lang="ts">
import UndoRedo from './UndoRedo.vue';
import SetBrowser from './set_browser/SetBrowserContainer.vue';

import HistoryLog from './modals/HistoryLog.vue';
</script>

<template>
    <div id="menuBar" class="px-4 py-2 md:py-4 absolute top-0 w-screen flex flex-nowrap pointer-events-none">
        <div v-if="!inputStore.forceInput" class="flex flex-nowrap justify-start align-start child-events gap-2">
            <Btn tooltip="Manage your local & on-chain set." @click="openSetBrowser">
                <i class="far fa-folder"/> Manage Sets
            </Btn>
            <UndoRedo/>
            <Btn tooltip="Open the undo/redo history log" @click="pushModal(HistoryLog)">
                <i class="fas fa-history"/>
            </Btn>
            <a href="https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f" target="_blank"><Btn tooltip="Access the briq help"><i class="far fa-circle-question"/> Help</Btn></a>
        </div>
    </div>
</template>

<script lang="ts">
import { pushModal } from '../Modals.vue';

import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            setBrowser: false,
            inputStore,
        };
    },
    methods: {
        openSetBrowser() {
            pushModal(SetBrowser, { asModal: true });
        },
    },
});
</script>

<style>
.child-events > * {
    @apply pointer-events-auto;
}
#menuBar > * {
    @apply flex-auto;
}
</style>
