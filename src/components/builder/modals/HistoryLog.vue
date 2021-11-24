<template>
    <div class="w-1/2">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">History Log</h3>
            <div class="h-5/6 overflow-scroll">
                <p v-for="item, i in history">{{ i === index ? 'X' : ''}} {{ item.action }}</p>
            </div>
            <UndoRedo/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UndoRedo from '../../Tools/UndoRedo.vue';
export default defineComponent({
    data() {
        return {};
    },
    computed: {
        index: function() {
            return this.$store.state.undoRedo.command_index;
        },
        history: function() {
            return this.$store.state.undoRedo.command_history
        }
    },
    props: ["metadata"],
    emits: ["close"],
    components: { UndoRedo }
})
</script>