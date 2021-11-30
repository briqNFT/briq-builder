<template>
    <div v-if="fsm?.briq" class="fixed pointer-events-none" :style="{ 'left': `${fsm.curX+20}px`, 'top': `${fsm.curY+20}px` }">
        <div class="w-64 h-32 bg-briq-light p-2 rounded-md shadow-md">
        <h4>Briq #{{ fsm?.briq?.id ?? '' }}</h4>
        <p>Color: {{ fsm.briq.color }}</p>
        <p>Material: {{ fsm.briq.material }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import { builderInputFsm } from "../../../builder/inputs/BuilderInput"

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            fsm: builderInputFsm.state.gui
        }
    },
})
</script>
