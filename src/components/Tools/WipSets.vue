<template>
    <div class="wipsets">
        <h2>Local WIP sets</h2>
        <p><button @click="newSet">New Set</button></p>
        <div>
            <button v-for="wipset in wipSets" @click="selectSet(wipset.id)" :disabled="set.id == wipset.id">{{ wipset.name || wipset.id }}</button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from 'vue';

export default defineComponent({
    data() {
        return {
            set: toRef(this.$store.state.builderData, "currentSet"),
            wipSets: toRef(this.$store.state.builderData, "wipSets")
        };
    },
    methods: {
        newSet: function() {
            this.$store.dispatch("builderData/create_wip_set");
        },
        selectSet: function(setId: number) {
            this.$store.dispatch("builderData/select_set", setId);
        }
    }
})
</script>

<style scoped>
.wipsets :not(h2) {
    text-align: left;
}
</style>
