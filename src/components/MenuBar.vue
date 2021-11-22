<script setup lang="ts">
import Settings from './Tools/Settings.vue'
import UndoRedo from './Tools/UndoRedo.vue'
import Wallet from './Tools/Wallet.vue'
</script>

<template>
    <div id="menuBar">
        <div class="flex flex-nowrap justify-start align-start">
            <UndoRedo/>
        </div>
        <div class="flex flex-nowrap justify-center align-start">
            <button class="btn" disabled="true">Place</button>
            <button class="btn" disabled="true">Erase</button>
            <button class="btn" disabled="true">Paint</button>
        </div>
        <div class="flex flex-nowrap justify-end align-start">
            <Settings/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({    
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