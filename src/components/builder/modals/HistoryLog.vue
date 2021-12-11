<template>
    <div class="md:w-2/5 w-auto" style="height:60%;">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text-center w-full">History Log</h3>
            <div class="h-5/6 overflow-auto">
                <p v-for="item, i in history">{{ i === index ? 'X' : ''}} {{ getHumanOutput(item.action, item) }}</p>
                <p v-if="!history.length">No actions yet</p>
            </div>
            <UndoRedo/>
        </div>
    </div>
</template>

<script lang="ts">
import UndoRedo from '../UndoRedo.vue';
import { getHumanOutput } from '../../../builder/UndoRedo';

import { defineComponent } from 'vue';
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
    methods: {
        getHumanOutput
    },
    props: ["metadata"],
    emits: ["close"],
    components: { UndoRedo }
})
</script>
