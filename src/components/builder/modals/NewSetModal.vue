<script setup lang="ts">
import { SetData } from '@/builder/SetData';
import { useSetHelpers } from '@/components/builder/SetComposable';
import { computed, ref } from 'vue';

const { createNewSet, saveSetAndOpen, duplicateSet } = useSetHelpers();

const props = defineProps<{
    title: string,
    initialSet?: SetData,
    name?: string,
}>();

const name = ref('');
const placeholder = computed(() => props.name || props.initialSet?.name || 'New Set');

const emit = defineEmits(['close']);
const onClick = () => {
    if (!props.initialSet) {
        const set = createNewSet();
        set.name = name.value || placeholder.value;
        saveSetAndOpen(set);
    } else {
        const set = duplicateSet(props.initialSet);
        set.name = name.value || placeholder.value;
        saveSetAndOpen(set);
    }
    emit('close');
}
</script>

<template>
    <Window class="!max-w-[34rem]">
        <template #title>{{ title ?? 'Create new set' }}</template>
        <p class="mb-2">Name</p>
        <p><input v-model="name" :placeholder="placeholder" type="text" maxlength="200" minlength="1" class="w-full"></p>
        <div class="mt-6 flex justify-between">
            <Btn secondary @click="$emit('close')">Cancel</Btn>
            <Btn @click="onClick">Create</Btn>
        </div>
    </Window>
</template>