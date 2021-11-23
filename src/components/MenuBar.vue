<script setup lang="ts">
import Settings from './Tools/Settings.vue'
import UndoRedo from './Tools/UndoRedo.vue'
import Button from './generic/Button.vue'

import SetBrowser from './builder/set_browser/SetBrowser.vue'
</script>

<template>
    <div id="menuBar">
        <div class="flex flex-nowrap justify-start align-start">
            <UndoRedo/>
            <Button @click="setBrowser = !setBrowser">Browse</Button>
            <teleport to="#app">
                <SetBrowser asModal="true" @close="setBrowser=false" v-if="setBrowser"/>
            </teleport>
        </div>
        <div class="flex flex-nowrap justify-center align-start">
            <Button tooltip="In 'Place' mode, left-click to place and right-click to delete briqs." disabled="true">Place</Button>
            <Button tooltip="" disabled="true">Erase</Button>
            <Button tooltip="" disabled="true">Paint</Button>
        </div>
        <div class="flex flex-nowrap justify-end align-start">
            <Settings/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    data() {
        return {
            setBrowser: false
        };
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