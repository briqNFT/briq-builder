<script setup lang="ts">
import { SetData } from '@/builder/SetData';
import { useSetHelpers } from '@/components/builder/SetComposable';
import { ref } from 'vue';

const { createNewSet, saveSetAndOpen, duplicateSet } = useSetHelpers();

const props = defineProps<{
    title: string,
    initialSet?: SetData,
    name?: string,
}>();

const name = ref(props.name || props.initialSet.name || 'New Set');

const emit = defineEmits(['close']);
const onClick = () => {
    if (!props.initialSet) {
        const set = createNewSet();
        set.name = name.value;
        saveSetAndOpen(set);
    } else {
        const set = duplicateSet(props.initialSet);
        set.name = name.value;
        saveSetAndOpen(set);
    }
    emit('close');
}
</script>

<template>
    <Window class="!w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <template #title>{{ title }}</template>
        <p class="md:block hidden">
            Name your new creation: <input v-model="name" type="text" maxlength="200" minlength="1" size="60">
        </p>
        <p class="md:hidden block">
            Name your new creation: <input v-model="name" type="text" maxlength="200" minlength="1" size="30">
        </p>
        <button class="btn float-right my-4" @click="onClick">Create</button>
    </Window>
</template>