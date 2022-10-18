<script setup lang="ts">
import { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { hexUuid } from '@/Uuid';
import { ref, toRef, watch } from 'vue';
import { useStore } from 'vuex';
import Flyout from '../generic/Flyout.vue';
import { pushModal } from '../Modals.vue';
import { pushPopup } from '@/Notifications';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ImportVoxModalVue from './modals/ImportVoxModal.vue';
import RenameSetVue from './modals/RenameSet.vue';
import Settings from './Settings.vue';
import { useSetHelpers } from './SetComposable';
import { useBuilderInput } from './InputComposable';
import { vCloseOutside } from '@/components/CloseOnClickOutsideComposable';
import { useRecording } from './Recording';
import NewSetModalVue from './modals/NewSetModal.vue';
import { DEV } from '@/Meta';
import CameraTools from './CameraTool.vue';

const props = withDefaults(defineProps<{
    open?: boolean,
}>(), {
    open: false,
});

const emit = defineEmits(['close']);

const mode = ref('MENU' as 'MENU' | 'SETTINGS' | 'CAMERA_SETTINGS');

// Reset the menu mode when reopening it.
watch(toRef(props, 'open'), (o, n) => {
    if (!o && n)
        mode.value = 'MENU';

});

const { isRecording, startRecording, stopRecording } = useRecording();


const { currentSet, selectSet } = useBuilder();
const { inputStore, activeInputButton, switchToState, currentInput } = useBuilderInput();

const renameSet = () => {
    pushModal(RenameSetVue, { set: currentSet.value.id })
}

const store = useStore();

const { downloadSet } = useSetHelpers();

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
                pushModal(NewSetModalVue, { title: 'Import set', initialSet: set })

            }
        } catch (err) {
            pushPopup('error', 'Error loading file', `Error while loading file ${fileHandle.name}\n${err?.message}`);
            console.error(err);
        }
}

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

const selectAllbriqs = (event: Event) => {
    event.preventDefault();
    switchToState('inspect');
    inputStore.selectionMgr.selectAll();
}

const unselectAllBriqs = (event: Event) => {
    event.preventDefault();
    inputStore.selectionMgr.clear();
}

const onCloseMenu = () => {
    if (mode.value === 'CAMERA_SETTINGS')
        return;
    setTimeout(() => {
        emit('close');
    });
}
</script>

<style scoped>
#app button {
    @apply text-xs tall-sm:text-sm justify-between mx-2 py-1 tall-sm:py-2 tall-md:py-3;
}
#app hr {
    @apply my-1 tall-md:my-2;
}
#app button span {
    @apply text-xs pl-2 tracking-tighter;
}
</style>

<template>
    <div class="relative">
        <div v-if="open" class="absolute z-50" v-close-outside="onCloseMenu">
            <Flyout id="menuFlyout" class="mx-1 sm:mx-2 mt-1 sm:mt-2 py-2 rounded text-sm font-normal">
                <template v-if="mode === 'MENU'">
                    <div class="max-h-[80vh] tall-md:max-h-[90vh] overflow-auto flex flex-col">
                        <Btn @click="renameSet" no-background>Rename set</Btn>
                        <RouterLink class="block mx-2" :to="{ name: 'Profile', query: { tab: 'CREATION' } }"><Btn class="w-full !mx-0" no-background>Manage my sets</Btn></RouterLink>
                        <hr>
                        <Btn @click="pushModal(NewSetModalVue, { title: 'New Set' })" no-background>New creation</Btn>
                        <Btn @click="importSetFromFile()" no-background>Import from file</Btn>
                        <Btn @click="pushModal(NewSetModalVue, { title: 'Duplicate set', name: `Copy of ${currentSet.name}`, initialSet: currentSet })" no-background>Duplicate creation</Btn>
                        <Btn @click="downloadSet(currentSet)" no-background>Save to computer</Btn>
                        <hr>
                        <Btn @click="store.dispatch('undo_history')" no-background>Undo <span>Ctrl&ThinSpace;+&ThinSpace;U</span></Btn>
                        <Btn @click="store.dispatch('redo_history')" no-background>Redo <span>Ctrl&ThinSpace;+&ThinSpace;Shift&ThinSpace;+&ThinSpace;U</span></Btn>
                        <hr>
                        <Btn no-background @click="selectCopy">Copy <span>Ctrl&ThinSpace;+&ThinSpace;C</span></Btn>
                        <Btn no-background :disabled="currentInput !== 'copy_paste'">Paste <span>Ctrl&ThinSpace;+&ThinSpace;V</span></Btn>
                        <hr>
                        <Btn no-background @click="selectAllbriqs">Select all briqs <span>Ctrl&ThinSpace;+&ThinSpace;A</span></Btn>
                        <Btn no-background @click="deleteBriqs" :disabled="!inputStore.selectionMgr.selectedBriqs.length">Delete selected briqs <span class="text-sm">⌦</span></Btn>
                        <hr>
                        <Btn v-if="DEV" no-background @click="!isRecording ? startRecording() : stopRecording()">{{ !isRecording ? 'Start Recording' : 'Stop Recording' }}</Btn>
                        <Btn @click="mode = 'CAMERA_SETTINGS'" no-background>Camera settings</Btn>
                        <Btn @click="mode = 'SETTINGS'" no-background>Settings</Btn>
                        <a class="block mx-2" href="https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f" target="_blank"><Btn class="w-full !mx-0" no-background>Help</Btn></a>
                    </div>
                </template>
                <template v-else-if="mode === 'CAMERA_SETTINGS'">
                    <CameraTools/>
                </template>
                <template v-else>
                    <Settings/>
                </template>
            </Flyout>
        </div>
        <Hotkey v-if="activeInputButton === 'select'" name="delete-1" :data="{ onDown: true, code: 'Delete' }" :handler="() => deleteBriqs()"/>
        <Hotkey v-if="activeInputButton === 'select'" name="delete-2" :data="{ onDown: true, code: 'Backspace' }" :handler="() => deleteBriqs()"/>
        <Hotkey name="select-all" :data="{ key: 'a', ctrl: true, onDown: true }" :handler="selectAllbriqs"/>
        <Hotkey name="escape" :handler="unselectAllBriqs"/>
    </div>
</template>