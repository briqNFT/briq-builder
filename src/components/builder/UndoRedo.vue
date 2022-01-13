<template>
    <div>
        <Hotkey name="undo" :data="{ key: 'z', ctrl: true }" :handler="() => undo()"/>
        <Hotkey name="redo" :data="{ key: 'z', ctrl: true, shift: true }" :handler="() => redo()"/>
        <Btn @click="undo" :disabled="!canUndo" tooltip="Undo (Ctrl + Z)">
            <p><i class="fas fa-undo"></i></p>
        </Btn>
        <Btn @click="redo" :disabled="!canRedo" class="ml-1" tooltip="Redo (Ctrl + Shift + Z)">
            <p><i class="fas fa-redo"></i></p>
        </Btn>
    </div>
</template>

<script lang="ts">
import Button from '../generic/Button.vue'

import { defineComponent } from 'vue';
export default defineComponent({
    components: { Button },
    computed: {
        store: function() {
            return this.$store.state.undoRedo;
        },
        index: function() {
            return this.store.command_index;
        },
        history: function() {
            return this.store.command_history;
        },
        canUndo: function() { return this.index >= 0; },
        canRedo: function() { return this.index < this.history.length - 1; },
    },
    methods: {
        undo: function() {
            this.$store.dispatch("undo_history");
        },
        redo: function() {
            this.$store.dispatch("redo_history");
        },
    }
})
</script>

<style scoped>

</style>
