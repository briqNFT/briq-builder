<script setup lang="ts">
import SetGridItem from './SetGridItem.vue';
</script>

<template>
    <div :class="'bg-briq dark:bg-briq-darker alternate-buttons visible px-8 py-4 md:container md:mx-auto'"
        @click="openDetails = undefined"
    >
        <button v-if="asModal" class="float-right text-2xl" @click="$emit('close')">X</button>
        <h2 class="text-center my-8">Browse sets</h2>
        <div class="my-4">
            <p><input class="w-full" v-model="searchText" type="text" placeholder="Search by set ID or set name"/></p>
            <p class="flex gap-2 my-4">
                <Btn tooltip="Create a new WIP set." @click="createSet"><i class="far fa-file"></i> New</Btn>
                <Btn tooltip="Import a local set." @click="importSet"><i class="fas fa-file-import"></i> Import from file</Btn>
                <Btn tooltip="Delete all selected sets." @click="deleteAll" :disabled="!canDelete"><i class="far fa-trash-alt"></i> Delete local sets</Btn>
                <!--
                <Btn tooltip="Disassemble all selected sets." @click="disassembleAll" :disabled="!canDisassemble"><i class="far fa-trash-alt"></i> Disassemble all</Btn>
                -->
            </p>
        </div>
        <div class="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div v-if="chainSets.length === 0">Nothing here yet.</div>
            <SetGridItem v-for="setId in chainSets" :key="setId" :setId="setId"
                :searchText="searchText"
                :openDetails="openDetails === setId"
                :selected="selected[setId]"
                @open="(x: string) => openDetails = x"
                @selectSet="(val: boolean) => onSelectSet(setId, val)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { setsManager } from '../../../builder/SetsManager';
import { SetData } from '../../../builder/SetData';

import { pushModal } from '../../Modals.vue'
import TextModal from '../../generic/TextModal.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            searchText: "",
            openDetails: undefined as undefined | string,
            selected: {} as { [setId: string]: boolean }
        }
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ['messages'],
    computed: {
        asModal() {
            return this?.metadata?.asModal;
        },
        chainSets: function() {
            return setsManager.setList;
        },
        selectedSets() {
            return Object.keys(this.selected);
        },
        canDelete() {
            return this.selectedSets.length && this.selectedSets.every(setId => setsManager.getInfo(setId)?.local);
        },
        canDisassemble() {
            return this.selectedSets.length && this.selectedSets.every(setId => setsManager.getInfo(setId)?.chain);            
        }
    },
    methods: {
        createSet() {
            setsManager.createLocalSet();
        },
        async importSet() {
            let fileHandles = await window.showOpenFilePicker();
            for (let fileHandle of fileHandles)
            {
                try
                {
                    let file = await fileHandle.getFile();
                    let contents = JSON.parse(await file.text());
                    let set = new SetData(contents.id).deserialize(contents);
                    setsManager.registerLocalSet(set);
                }
                catch(err) {
                    this.messages.pushMessage("Error while loading file " + fileHandle.name + " - " + err.message);
                    console.log(err);
                }
            }
        },
        onSelectSet(setId: string, value: boolean) {
            if (!value)
                delete this.selected[setId];
            else
                this.selected[setId] = true;
        },
        async deleteAll() {
            let btn = await pushModal(TextModal, {
                "title": "Confirm delete?",
                "text": "This selected sets will be deleted. This cannot be undone. Are you sure?",
                "buttons": [{ "text": "Yes" }, { "text": "No" }]
            });
            if (btn !== 0)
                return;
            for (let setId of this.selectedSets)
            {
                setsManager.deleteLocalSet(setId);
                delete this.selected[setId];
            }
        },
        async disassembleAll() {
        }
    }
})
</script>