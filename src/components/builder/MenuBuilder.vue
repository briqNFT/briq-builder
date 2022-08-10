<script setup lang="ts">
import { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { hexUuid } from '@/Uuid';
import { ref, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import Flyout from '../generic/Flyout.vue';
import { pushModal } from '../Modals.vue';
import { pushPopup } from '../NotificationsComposable';
import { useCurrentSet } from './CurrentSet';
import ImportVoxModalVue from './modals/ImportVoxModal.vue';
import RenameSetVue from './modals/RenameSet.vue';
import Settings from './modals/Settings.vue';
import { useSetHelpers } from './SetComposable';

const props = withDefaults(defineProps<{
    open?: boolean,
}>(), {
    open: false,
});

const mode = ref('MENU' as 'MENU' | 'SETTINGS');

// Reset the menu mode when reopening it.
watch(toRef(props, 'open'), (o, n) => {
    if (!o && n)
        mode.value = 'MENU';

});

const { currentSet } = useCurrentSet();

const renameSet = () => {
    pushModal(RenameSetVue, { set: currentSet.id })
}

const store = useStore();

const { createNewSetAndOpen, duplicateSet, openSetInBuilder } = useSetHelpers();

const importSetFromFile = async () => {
    let fileHandles = await showOpenFilePickerPolyfill();
    for (let fileHandle of fileHandles)
        try {
            let file = await fileHandle.getFile();
            if ((file.name as string).endsWith('.vox'))
                await pushModal(ImportVoxModalVue, { file: file, fileData: file.arrayBuffer() });
            else {
                let contents = JSON.parse(await file.text());
                // For now, overwrite briqs in Realms/default
                for (let briq of contents.briqs)
                    briq.data.material = CONF.theme === 'realms' ? '0x2' : '0x1';
                let set = new SetData(contents.id).deserialize(contents);
                set.id = hexUuid();
                createNewSetAndOpen(set);
                await store.dispatch('builderData/select_set', set.id);
            }
        } catch (err) {
            pushPopup('error')
            //this.messages.pushMessage('Error while loading file ' + fileHandle.name + ' - ' + err.message);
            console.error(err);
        }
}

const duplicate = () => openSetInBuilder(duplicateSet(currentSet.id).id);

</script>

<style scoped>
#app button {
    @apply text-sm justify-start;
}
</style>

<template>
    <div class="relative">
        <div v-if="open" class="absolute z-50">
            <Flyout id="menuFlyout" class="mx-4 mt-1 flex flex-col w-max rounded-md text-sm font-normal" @click="">
                <template v-if="mode === 'MENU'">
                    <Btn @click="renameSet" no-background>Rename set</Btn>
                    <RouterLink :to="{ name: 'Profile' }"><Btn class="w-full" no-background>Manage my sets</Btn></RouterLink>
                    <hr>
                    <Btn @click="createNewSetAndOpen" no-background>New creation</Btn>
                    <Btn @click="importSetFromFile" no-background>Import from file</Btn>
                    <Btn @click="duplicate" no-background>Duplicate creation</Btn>
                    <Btn no-background>(todo) Save to computer</Btn>
                    <hr>
                    <Btn @click="store.dispatch('undo_history')" no-background>Undo</Btn>
                    <Btn @click="store.dispatch('redo_history')" no-background>Redo</Btn>
                    <hr>
                    <Btn no-background>Copy</Btn>
                    <Btn no-background>Paste</Btn>
                    <hr>
                    <Btn no-background>Select all objects</Btn>
                    <hr>
                    <Btn @click="mode = 'SETTINGS'" no-background>Settings</Btn>
                    <Btn no-background>Help</Btn>
                </template>
                <template v-else>
                    <Settings/>
                </template>
            </Flyout>
        </div>
    </div>
</template>