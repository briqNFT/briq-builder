<script setup lang="ts">
import Button from "./generic/Button.vue";
import PickMaterial from "./PickMaterial.vue";
import { setTooltip } from '../Messages'
</script>

<template>
    <div id="sideBar" class="flex flex-wrap flex-col px-5 py-20 absolute right-0 top-0 h-full w-20 justify-center content-end">
        <div class="flex flex-col content-end my-8">
            <Button class="my-1" tooltip="Create a new WIP set." @click="newSet">New</Button>
            <Button class="my-1" tooltip="Delete the current WIP set." @click="deleteSet">Delete</button>
            <Button class="my-1" tooltip="Remove all briqs from the current WIP set." @click="clear" :disabled="set.briqsDB.briqs.size == 0">Clear</button>
        </div>
        <div class="flex flex-col content-end my-8">
            <h4 class="text-center font-bold">SETS</h4>
            <Button v-for="wipset in wipSets"
                class="my-1"
                @click="selectSet(wipset.id)"
                :disabled="set.id == wipset.id"
                :tooltip="(set.id == wipset.id) ? 'Set ' + set.id + ' is active.' : 'Click to switch to set ' + (wipset.name || wipset.id)"
                >{{ wipset.name || wipset.id }}</button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            set: toRef(this.$store.state.builderData, "currentSet"),
            wipSets: toRef(this.$store.state.builderData, "wipSets")
        };
    },
    methods: {
        clear: function() {
            this.$store.dispatch("builderData/clear");
        },
        newSet: function() {
            this.$store.dispatch("builderData/create_wip_set");
        },
        deleteSet: function() {
            this.$store.dispatch("builderData/delete_wip_set", this.set.id);
        },
        selectSet: function(setId: number) {
            this.$store.dispatch("builderData/select_set", setId);
        }

    }
})
</script>

<style scoped>
</style>
