<template>
    <div>
        <Button @click="undo" :disabled="!canUndo" class="mx-0.5" tooltip="Undo (Ctrl + Z)">
            <p><i class="fas fa-undo"></i></p>
        </button>
        <Button @click="redo" :disabled="!canRedo" class="mx-0.5" tooltip="Redo (Ctrl + Shift + Z)">
            <p><i class="fas fa-redo"></i></p>
        </button>
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
    mounted() {
        window.addEventListener('keyup', this.shortcut);
    },
    unmounted() {
        window.removeEventListener('keyup', this.shortcut);
    },
    methods: {
        undo: function() {
            this.$store.dispatch("undo_history");
        },
        redo: function() {
            this.$store.dispatch("redo_history");
        },
        shortcut(event: KeyboardEvent) {
            console.log(event);
            if (!event.shiftKey && event.ctrlKey && event.key === 'z')
                this.$store.dispatch("undo_history");
            else if (event.shiftKey && event.ctrlKey && event.key === 'Z')
                this.$store.dispatch("redo_history");
        }
    }
})
</script>

<style scoped>

</style>
