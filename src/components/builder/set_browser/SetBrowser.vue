<script setup lang="ts">
import SetGridItem from './SetGridItem.vue';
import Tooltip from '../../generic/Tooltip.vue';
import { hexUuid } from '../../../Uuid';
</script>

<template>
    <div class="my-4">
        <p><input class="w-full" v-model="searchText" type="text" placeholder="Search by set ID or set name"/></p>
        <p class="flex gap-2 my-4">
            <Btn tooltip="Create a new WIP set." @click="createSet"><i class="far fa-file"></i> New</Btn>
            <Btn tooltip="Import a local set or a .vox file" @click="importSet"><i class="fas fa-file-import"></i> Import from file</Btn>
            <Btn tooltip="Delete all selected sets." @click="deleteAll" :disabled="!canDelete"><i class="far fa-trash-alt"></i> Delete local sets</Btn>
            <Btn v-if="canResetMigrationPrompt" tooltip="Un-hide all hidden legacy sets." @click="resetMigrationPrompt"><i class="fas fa-eye"></i> Show hidden legacy sets</Btn>
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
        <div v-for="oldSet of legacySets"
            class="w-full relative flex flex-col bg-darker rounded-md px-4 py-2 border-4 border-darker"
        >
            <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 rounded-md p-4 flex justify-center items-center">
                <button @click="openMigrateModal(oldSet)">
                    <p class="font-semibold text-center -rotate-[30deg] bg-base bg-opacity-80 px-4 rounded-xl">Migration Needed!<br/>Click here<br/>to migrate set</p>
                </button>
            </div>
            <div class="flex flex-nowrap items-center">
                <h3 class="flex-auto text-center my-1 break-all">{{ oldSetsData?.[oldSet]?.getName() || oldSet }}</h3>
            </div>
            <div class="flex-1 flex justify-center min-h-[2rem] my-2">
                <div v-if="oldSetsImg?.[oldSet]" class="flex flex-col justify-center"><img :src="oldSetsImg?.[oldSet].currentSrc" class="rounded-md"/></div>
                <div v-else="" class="imagePlaceholder min-h-[8rem] rounded-md flex-1 text-center flex flex-col justify-center text-md font-semibold tracking-wider"><p>No Image</p></div>
            </div>
            <Tooltip tooltip="Ignore this set and hide the migration prompt.">
                <button @click="hideMigrationPrompt(oldSet)" class="absolute top-0 right-0 px-4 py-4 font-semibold"><i class="fas fa-eye-slash"></i></button>
            </Tooltip>
        </div>
    </div>
</template>

<style scoped>
.imagePlaceholder
{
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0), 10px,
        rgba(247, 137, 74, 0.5) 10px,
        rgba(247, 137, 74, 0.5) 15px
    );
}
</style>


<script lang="ts">
import { setsManager } from '../../../builder/SetsManager';
import { SetData } from '../../../builder/SetData';

import ImportVoxModal from '../modals/ImportVoxModal.vue';

import { pushModal } from '../../Modals.vue'
import TextModal from '../../generic/TextModal.vue';

import { CONF } from '@/Conf';

import { legacySetsMgr } from './LegacySetsMgr';
import MigrateSet from '../modals/MigrateSet.vue';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            searchText: "",
            openDetails: undefined as undefined | string,
            selected: {} as { [setId: string]: boolean },
            oldSetsData: toRef(legacySetsMgr, 'oldSetsData'),
            oldSetsImg: toRef(legacySetsMgr, 'oldSetsImg'),
        }
    },
    props: ["metadata"],
    inject: ['messages'],
    async mounted() {
    },
    computed: {
        legacySets() {
            return legacySetsMgr.getSetsToMaybeMigrate();
        },
        canResetMigrationPrompt() {
            return legacySetsMgr.ignoredSets.length;
        },
        //
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
        openMigrateModal(sid: string) {
            pushModal(MigrateSet, {
                set: sid,
                setData: this.oldSetsData[sid],
                img: this.oldSetsImg[sid],
            });
        },
        hideMigrationPrompt(sid: string)
        {
            legacySetsMgr.ignoreSet(sid);
        },
        resetMigrationPrompt()
        {
            legacySetsMgr.resetIgnoredSets();
        },
        //
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
                    if ((file.name as string).endsWith(".vox"))
                    {
                        await pushModal(ImportVoxModal, { file: file, fileData: file.arrayBuffer() });
                    }
                    else
                    {
                        let contents = JSON.parse(await file.text());
                        // For now, overwrite briqs in Realms/default
                        for (let briq of contents.briqs)
                            briq.data.material = CONF.theme === "realms" ? "0x2" : "0x1";
                        let set = new SetData(contents.id).deserialize(contents);
                        set.id = hexUuid();
                        setsManager.registerLocalSet(set);
                        await this.$store.dispatch("builderData/select_set", set.id);
                    }
                }
                catch(err) {
                    this.messages.pushMessage("Error while loading file " + fileHandle.name + " - " + err.message);
                    console.error(err);
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