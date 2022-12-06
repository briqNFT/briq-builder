<script setup lang="ts">
import type { SetData } from '@/builder/SetData';
import { VoxLoader } from '@/builder/VoxLoader';

import { onBeforeMount, ref } from 'vue';
import builderSettings from '@/builder/graphics/Settings';
import { useSetHelpers } from '../SetComposable';
import { pushPopup } from '@/Notifications';
import { setsManager } from '@/builder/SetsManager';

const { saveSetAndOpen } = useSetHelpers();


const loader = ref(undefined as VoxLoader | undefined);
const set = ref(undefined as SetData | undefined);
const error = ref(undefined as any);

const emit = defineEmits(['close']);

const props = defineProps<{
    file: File,
    data: Promise<ArrayBuffer>,
}>();

onBeforeMount(async () => {
    try {
        loader.value = new VoxLoader(await props.data);
        set.value = loader.value.set;
        set.value.name = props.file.name.replace('.vox', '');
    } catch (err) {
        console.error(err);
        error.value = err;
    }
});

const importSet = () => {
    if (!set.value)
        return;
    setsManager.registerLocalSet(set.value);
    saveSetAndOpen(set.value);
    emit('close');
}

const copyError = () => {
    navigator.clipboard.writeText(error.value);
    pushPopup('info', 'Error copied', 'Error copied to clipboard');
}

</script>

<template>
    <Window class="!w-auto">
        <template #big-title>Import .vox file</template>
        <div class="w-full">
            <template v-if="!set">
                <h3>There was an error while loading "{{ file.name }}"</h3>
                <p class="bg-grad-light rounded font-mono text-sm px-2 py-1 my-2">
                    {{ error }}
                    <Btn secondary class="text-sm" @click="copyError"><i class="fas fa-copy"/></Btn>
                </p>
            </template>
            <template v-else>
                <h4>Set Name</h4>
                <p><input type="text" v-model="set.name" maxlength="200" class="w-full"></p>
                <p class="float-right my-8 ml-4"><Btn @click="importSet">Import</Btn></p>
                <p>Made of {{ set.getAllBriqs().length }} briqs.</p>
                <p>All briqs will be loaded with the standard material.</p>
                <p class="text-sm italic">
                    Disclaimer: importing .vox files may be lossy, as briq does not support all functionality of that
                    format.
                </p>
                <p
                    v-if="loader?.warnings?.length"
                    class="bg-grad-light rounded font-mono text-sm px-2 py-1 my-2 max-h-40 overflow-auto">
                    <Btn secondary class="float-right text-sm" @click="copyError"><i class="fas fa-copy"/></Btn>
                    <span class="font-bold">Some warnings while importing</span><br>
                    <span v-for="warning in loader?.warnings" :key="warning">{{ warning }}<br></span>
                </p>
            </template>
        </div>
    </Window>
</template>