<template>
    <div id="debugWindow">
        <p>{{ builderDataRepr }}</p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            builderData: this.$store.state.builderData
        }
    },
    computed: {
        builderDataRepr: function() {
            return this.$store.state.undoRedo.command_history.map((x, i) => (i == this.$store.state.undoRedo.command_index ? "X": "") + x.action).join("\n");
            /*
            let ret = [];
            builderData.currentSet.forEach((_, pos) => ret.push(pos));
            return JSON.stringify(ret);
            //*/
            //return JSON.stringify(Array.from(builderData.currentSet.briqs.values()).map(x => Array.from(x)), undefined, 4);
            //return JSON.stringify(Array.from(builderData.BriqsDB.briqs.values()));
            //return JSON.stringify(Array.from(builderData.currentSet.briqs.values()));
        }
    }
})
</script>

<style scoped>
#debugWindow
{
    max-height: 300px;
    overflow: scroll;
}
</style>
