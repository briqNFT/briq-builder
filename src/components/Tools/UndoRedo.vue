<template>
    <div>
        <button @click="undo" :disabled="!canUndo" class="btn">
            <p>Undo</p>
        </button>
        <button @click="redo" :disabled="!canRedo" class="btn">
            <p>Redo</p>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
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
