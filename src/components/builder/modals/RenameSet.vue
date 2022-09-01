<script setup lang="ts">
import { setsManager } from '@/builder/SetsManager';
import { ref } from 'vue';
import { useBuilder } from '../BuilderComposable';

const { currentSet } = useBuilder();

const props = defineProps<{
    set: string, // Set ID
}>();

const emit = defineEmits(['close'])
const setData = setsManager.getInfo(props.set).getSet();
const name = ref(setData.getName());

const save = () => {
    currentSet.value.name = name.value;
    emit('close');
}
</script>

<template>
    <Window class="!w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <template #title>Rename set</template>
        <p>Set {{ set }}</p>
        <p class="break-words">Current name: {{ setData.getName() }}</p>
        <p class="md:block hidden">
            New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="60">
        </p>
        <p class="md:hidden block">
            New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="30">
        </p>
        <button class="btn float-right my-4" @click="save">Save</button>
    </Window>
</template>
