<script setup lang="ts">
import { ref, toRaw, watchEffect } from 'vue';
import { usePresetHelpers } from './CameraComposable';
import Hotkey from '@/components/generic/Hotkey.vue';

const emit = defineEmits(['close']);

const props = withDefaults(defineProps<{
    metadata?: {
        name: string,
    }
}>(), {
    metadata: {
        name: 'New preset',
    }
});

const addPreset = () => {
    emit('close', {
        name: toRaw(_name.value),
        position: toRaw(_position.value),
        target: toRaw(_target.value),
        fov: toRaw(_fov.value)
    })
}

const { isValidName, usePreset, cameraSettings } = usePresetHelpers();

const _position = ref(0);
const _target = ref(0);
const _fov = ref(0);
const _name = ref(props.metadata.name);

watchEffect(() => {
    _position.value = cameraSettings.value.position.map(x => Math.round(x*1000)/1000);
    _target.value = cameraSettings.value.target.map(x => Math.round(x*1000)/1000);
    _fov.value = cameraSettings.value.fov;
})

watchEffect(() => {
    usePreset({
        position: _position.value,
        target: _target.value,
        fov: _fov.value
    })
})
</script>

<style scoped>
input[type="number"] {
    @apply text-sm tracking-tight;
    min-width: 6rem;
}
</style>

<template>
    <Window size="w-auto">
        <Hotkey name="accept" :data="{ code: 'Enter' }" :handler="addPreset"></Hotkey>
        <template #title>Add custom preset</template>
        <div class="font-mono grid gap-1 md:grid-cols-[max-content_minmax(max-content,1fr)]">
            <p>Name:</p>
            <p><input type="text" size="12" maxlength="12" v-model="_name"/></p>
            <p>Position (X/Y/Z):</p>
            <p>
                <input type="number" min="-300" max="300" v-model="_position[0]"/> / 
                <input type="number" min="-300" max="300" v-model="_position[1]"/> / 
                <input type="number" min="-300" max="300" v-model="_position[2]"/>
            </p>
            <p>Target (X/Y/Z):</p>
            <p>
                <input type="number" min="-300" max="300" v-model="_target[0]"/> / 
                <input type="number" min="-300" max="300" v-model="_target[1]"/> / 
                <input type="number" min="-300" max="300" v-model="_target[2]"/>
            </p>
            <p>FOV:</p>
            <p><input type="number" min="5" max="150" v-model="_fov"/></p>
        </div>
        <p class="flex justify-center mt-4">
            <Btn v-if="isValidName(_name)" @click="addPreset">Add preset</Btn>
            <Btn v-else="" tooltip="A preset with this name already exists" :disabled="true">Add preset</Btn>
        </p>
    </Window>
</template>