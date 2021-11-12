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
import { builderData } from '../../builder/BuilderData';

export default defineComponent({
    data() {
        return {
            set: toRef(builderData, "currentSet"),
            wipSets: toRef(builderData, "wipSets")
        };
    },
    methods: {
        newSet: function() {
            builderData.newSet();
        },
        selectSet: function(setId: number) {
            builderData.selectSet(setId);
        }
    }
})
</script>

<style scoped>
.wipsets :not(h2) {
    text-align: left;
}
</style>
