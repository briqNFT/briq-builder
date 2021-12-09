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
    data() {
        return {
            undoSC: undefined,
            redoSC: undefined,
        }
    },
    inject: ["hotkeyMgr"],
    mounted() {
        this.undoSC = this.hotkeyMgr.register("undo", { key: "KeyW", ctrl: true }).subscribe("undo", () => this.undo());
        this.redoSC = this.hotkeyMgr.register("redo", { key: "KeyW", ctrl: true, shift: true }).subscribe("redo", () => this.redo());
    },
    unmounted() {
        this.hotkeyMgr.unsubscribe(this.undoSC);
        this.hotkeyMgr.unsubscribe(this.redoSC);
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
