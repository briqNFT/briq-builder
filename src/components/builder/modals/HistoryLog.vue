<template>
    <Window class="md:!w-2/5 !w-auto" style="height:60%;">
        <template #title>History Log</template>
        <div class="h-5/6 overflow-auto">
            <p v-for="item, i in history">{{ i === index ? 'X' : ''}} {{ getHumanOutput(item.action, item) }}</p>
            <p v-if="!history.length">No actions yet</p>
        </div>
        <UndoRedo/>
    </Window>
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
    components: { UndoRedo }
})
</script>
