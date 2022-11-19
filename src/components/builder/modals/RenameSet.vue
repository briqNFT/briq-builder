<script setup lang="ts">
import { setsManager } from '@/builder/SetsManager';
import { computed, ref } from 'vue';
import { useBooklet } from '../BookletComposable';
import { useBuilder } from '../BuilderComposable';

const { currentSet } = useBuilder();

const props = defineProps<{
    set: string, // Set ID
}>();

const emit = defineEmits(['close'])
const setData = setsManager.getInfo(props.set).getSet();
const name = ref(setData.getName());
const description = ref(setData.description);

const hasBooklet = computed(() => !!setsManager.getInfo(props.set).booklet);

const save = () => {
    currentSet.value.name = name.value;
    currentSet.value.description = description.value;
    emit('close');
}
</script>

<template>
    <Window class="!w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <template #title>Rename set</template>
        <div class="my-4">
            <p class="mb-2">Name</p>
            <p class="md:block hidden">
                <input v-model="name" @keydown.enter="save" :disabled="hasBooklet" type="text" maxlength="200" minlength="1" size="60">
            </p>
            <p class="md:hidden block">
                <input v-model="name" @keydown.enter="save" :disabled="hasBooklet" type="text" maxlength="200" minlength="1" size="30">
            </p>
        </div>
        <div class="my-4">
            <p class="mb-2">Description</p>
            <p class="md:block hidden">
                <textarea v-model="description" :disabled="hasBooklet" cols="60"/>
            </p>
            <p class="md:hidden block">
                <textarea v-model="description" :disabled="hasBooklet" cols="30"/>
            </p>
        </div>
        <div class="mt-2 mb-6 float-right w-max flex gap-4 items-center">
            <p v-if="hasBooklet" class="text-sm font-medium text-grad-dark">Official sets cannot be renamed</p>
            <button v-else class="btn" @click="save" :disabled="hasBooklet">Save</button>
        </div>
    </Window>
</template>
