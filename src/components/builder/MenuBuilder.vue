<script setup lang="ts">
import { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { hexUuid } from '@/Uuid';
import { nextTick, ref, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import Flyout from '../generic/Flyout.vue';
import { pushModal } from '../Modals.vue';
import { pushPopup } from '@/Notifications';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ImportVoxModalVue from './modals/ImportVoxModal.vue';
import RenameSetVue from './modals/RenameSet.vue';
import Settings from './Settings.vue';
import { useSetHelpers } from './SetComposable';
import DownloadSetVue from './modals/DownloadSet.vue';
import { useBuilderInput } from './InputComposable';
import { vCloseOutside } from '@/components/CloseOnClickOutsideComposable';

const props = withDefaults(defineProps<{
    open?: boolean,
}>(), {
    open: false,
});

const emit = defineEmits(['close']);

const mode = ref('MENU' as 'MENU' | 'SETTINGS');

// Reset the menu mode when reopening it.
watch(toRef(props, 'open'), (o, n) => {
    if (!o && n)
        mode.value = 'MENU';

});

const { currentSet, selectSet } = useBuilder();
const { inputStore, activeInputButton, switchToState, currentInput } = useBuilderInput();

const renameSet = () => {
    pushModal(RenameSetVue, { set: currentSet.value.id })
}

const store = useStore();

const { createNewSetAndOpen, duplicateSet, openSetInBuilder } = useSetHelpers();

const downloadSetLocally = () => {
    pushModal(DownloadSetVue, { setId: currentSet.value.id });
}

const importSetFromFile = async () => {
    let fileHandles = await showOpenFilePickerPolyfill();
    for (let fileHandle of fileHandles)
        try {
            let file = await fileHandle.getFile();
            if ((file.name as string).endsWith('.vox'))
                await pushModal(ImportVoxModalVue, { file: file, data: file.arrayBuffer() });
            else {
                let contents = JSON.parse(await file.text());
                // For now, overwrite briqs in Realms/default
                for (let briq of contents.briqs)
                    briq.data.material = CONF.theme === 'realms' ? '0x2' : '0x1';
                let set = new SetData(contents.id).deserialize(contents);
                set.id = hexUuid();
                createNewSetAndOpen(set);
            }
        } catch (err) {
            pushPopup('error', 'Error loading file', `Error while loading file ${fileHandle.name}\n${err?.message}`);
            console.error(err);
        }
}

const duplicate = () => openSetInBuilder(duplicateSet(currentSet.value.id).id);

const selectCopy = () => {
    if (activeInputButton.value !== 'select')
        inputStore.selectionMgr.selectAll()
    switchToState('copy_paste');
}

const deleteBriqs = async () => {
    await store.dispatch(
        'builderData/place_briqs',
        inputStore.selectionMgr.selectedBriqs.map((briq) => ({ pos: briq.position })),
    );
}

const selectAllbriqs = () => {
    switchToState('inspect');
    inputStore.selectionMgr.selectAll();
}

const onCloseMenu = () => {
    setTimeout(() => {
        emit('close');
    });
}
</script>

<style scoped>
#app button {
    @apply text-sm justify-between mx-2;
}
#app hr {
    @apply my-2;
}
#app button span {
    @apply text-sm font-mono pl-2;
}
</style>

<template>
    <div class="relative">
        <div v-if="open" class="absolute z-50" v-close-outside="onCloseMenu">
            <Flyout id="menuFlyout" class="mx-4 mt-1 py-2 flex flex-col w-max rounded-md text-sm font-normal">
                <template v-if="mode === 'MENU'">
                    <Btn @click="renameSet" no-background>Rename set</Btn>
                    <RouterLink :to="{ name: 'Profile' }"><Btn class="w-full" no-background>Manage my sets</Btn></RouterLink>
                    <hr>
                    <Btn @click="createNewSetAndOpen()" no-background>New creation</Btn>
                    <Btn @click="importSetFromFile()" no-background>Import from file</Btn>
                    <Btn @click="duplicate" no-background>Duplicate creation</Btn>
                    <Btn @click="downloadSetLocally" no-background>Save to computer</Btn>
                    <hr>
                    <Btn @click="store.dispatch('undo_history')" no-background>Undo <span>⌃U</span></Btn>
                    <Btn @click="store.dispatch('redo_history')" no-background>Redo <span>⌃⇧U</span></Btn>
                    <hr>
                    <Btn no-background @click="selectCopy">Copy <span>⌃C</span></Btn>
                    <Btn no-background :disabled="currentInput !== 'copy_paste'">Paste <span>⌃V</span></Btn>
                    <hr>
                    <Btn no-background @click="selectAllbriqs">Select all briqs <span>⌃A</span></Btn>
                    <Btn no-background @click="deleteBriqs" :disabled="!inputStore.selectionMgr.selectedBriqs.length">Delete selected briqs <span>⌦</span></Btn>
                    <hr>
                    <Btn @click="mode = 'SETTINGS'" no-background>Settings</Btn>
                    <Btn no-background>Help</Btn>
                </template>
                <template v-else>
                    <Settings/>
                </template>
            </Flyout>
        </div>
        <Hotkey v-if="activeInputButton === 'select'" name="delete-1" :data="{ code: 'Delete' }" :handler="() => deleteBriqs()"/>
        <Hotkey v-if="activeInputButton === 'select'" name="delete-2" :data="{ code: 'Backspace' }" :handler="() => deleteBriqs()"/>
        <Hotkey name="select-all" :data="{ key: 'a', ctrl: true }" :handler="selectAllbriqs"/>
    </div>
</template>