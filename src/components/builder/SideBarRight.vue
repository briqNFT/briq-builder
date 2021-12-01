<script setup lang="ts">
import Button from "../generic/Button.vue";
import Settings from '../Tools/Settings.vue'
</script>

<template>
    <div class="absolute right-0 top-0 h-full w-60 pointer-events-none">
        <Settings @click="expanded = !expanded" class="pointer-events-auto"/>
        <div :class="'flex flex-nowrap flex-col mx-4 my-20 pointer-events-auto absolute top-0 h-full justify-top content-end ' + (expanded ? 'expanded' : 'unexpanded')">
            <div class="flex flex-col flex-nowrap gap-1">
                <Button>Help</button>
                <Button @click="$router.push({ path: '/settings' })">Settings</button>
                <Button @click="$router.push({ path: '/legal' })">Legal / Privacy</button>
                <Button @click="$router.push({ path: '/admin' })">Admin</button>
            </div>
            <div class="flex flex-col content-end my-8">
                <Button class="my-1" tooltip="Create a new WIP set." @click="newSet">New</Button>
                <Button class="my-1" tooltip="Copy a new WIP set." @click="copySet">Copy</Button>
                <Button class="my-1" tooltip="Delete the current WIP set." @click="deleteSet">Delete</button>
                <Button class="my-1" tooltip="Import a local set." @click="importSet">Import file</button>
                <div class="my-2"></div>
                <Button class="my-1" tooltip="Rename the current set" @click="rename">Rename</button>
                <Button class="my-1" tooltip="Export the set to the blockchain" @click="exportSet">Export</button>
                <div class="my-2"></div>
                <Button class="my-1" tooltip="Remove all briqs from the current WIP set." @click="clear" :disabled="set.briqsDB.briqs.size == 0">Clear</button>
            </div>
            <div class="flex flex-col content-end my-4">
                <h4 class="text-center font-bold">WIP SETS</h4>
                <Button v-for="wipset in wipSets"
                    class="my-1 h-auto"
                    @click="selectSet(wipset.id)"
                    :disabled="set.id == wipset.id"
                    :tooltip="(set.id == wipset.id) ? 'Set ' + set.id + ' is active.' : 'Click to switch to set ' + (wipset.name || wipset.id)"
                    >{{ wipset.name || wipset.id }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

import { setModal } from '../MiddleModal.vue';

import RenameSet from './modals/RenameSet.vue';
import ExportSet from './modals/ExportSet.vue';

import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            expanded: false,
            set: toRef(this.$store.state.builderData, "currentSet"),
            wipSets: toRef(this.$store.state.builderData, "wipSets")
        };
    },
    inject: ["messages"],
    methods: {
        clear: function() {
            this.$store.dispatch("builderData/clear");
        },
        newSet: function() {
            this.$store.dispatch("builderData/create_wip_set");
        },
        copySet: function() {
            let data = this.set.serialize();
            delete data.id;
            this.$store.dispatch("builderData/create_wip_set", data);
        },
        async importSet() {
            let fileHandles = await window.showOpenFilePicker();
            for (let fileHandle of fileHandles)
            {
                try
                {
                    let file = await fileHandle.getFile();
                    let contents = JSON.parse(await file.text());
                    this.$store.dispatch("builderData/create_wip_set", contents);
                }
                catch(err) {
                    this.messages.pushMessage("Error while loading file " + fileHandle.name + " - check console for details");
                    console.log(err);
                }
            }
        },
        deleteSet: function() {
            this.$store.dispatch("builderData/delete_wip_set", this.set.id);
        },
        selectSet: function(setId: number) {
            this.$store.dispatch("builderData/select_set", setId);
        },
        rename: function() {
            setModal(RenameSet, { set: this.set.id });
        },
        exportSet: function() {
            setModal(ExportSet, { set: this.set.id });
        },
    }
})
</script>

<style scoped>
.expanded {
    right: 0;
}
.unexpanded {
    right: -200px;
}
</style>
