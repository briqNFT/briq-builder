<script setup lang="ts">
import Tooltip from '../generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { usePresetHelpers } from './inputs/CameraComposable';
import DropDown from '../generic/DropDown.vue';
import { nextTick, ref, Ref, toRaw, watchEffect } from 'vue';
import { camera, orbitControls } from '@/builder/graphics/Builder';
import Flyout from '../generic/Flyout.vue';

defineEmits(['close']);

const {
    presets,
    fov,
    isValidName,
    usePreset,
    deletePreset,
    resetCamera,
    resetToPseudoIso,
    canCenterCamera,
    centerCamera,
    cameraSettings,
} = usePresetHelpers();

const mode = ref('regular' as 'regular' | 'new-camera');

const _position = ref(0);
const _target = ref(0);
const _fov = ref(0);
const _name = ref('New set');

const isPreset = ref(false);

watchEffect(() => {
    _position.value = cameraSettings.value.position.map(x => Math.round(x*1000)/1000);
    _target.value = cameraSettings.value.target.map(x => Math.round(x*1000)/1000);
    _fov.value = cameraSettings.value.fov;
    isPreset.value = false;
    console.log('EReset pres')
})

watchEffect(() => {
    usePreset({
        position: _position.value,
        target: _target.value,
        fov: _fov.value,
    })
})

const addPreset = () => {
    presets.value.push({
        name: toRaw(_name.value),
        position: toRaw(_position.value),
        target: toRaw(_target.value),
        fov: toRaw(_fov.value),
    });
    mode.value = 'regular';
    isPreset.value = true;
}

const onClick = (option: string, item: Ref<string | undefined>) => {
    if (option === 'Default')
        resetCamera()
    else if (option === 'Pseudo-isometric')
        resetToPseudoIso();
    else
        usePreset(presets.value.filter(x => x.name === option)[0]);
    item.value = option;
    _name.value = option;
    isPreset.value = true
    setTimeout(() => isPreset.value = true, 100);
}

const onOpenContextMenu = (option: string) => {
    return presets.value.some(x => x.name === option);
}

const hotkeyPreset = (preset: string) => {
    const target = orbitControls.controls.target.toArray();
    usePreset({
        position: {
            'x-pos': () => [target[0] + 10, target[1], target[2]],
            'x-neg': () => [target[0] - 10, target[1], target[2]],
            'z-pos': () => [target[0], target[1], target[2] + 10],
            'z-neg': () => [target[0], target[1], target[2] - 10],
            'y-pos': () => [target[0], target[1] + 10, target[2]],
            'y-neg': () => [target[0], target[1] - 10, target[2]],
        }[preset]!(),
        target: target,
        fov: camera.fov,
    });
}

</script>

<style scoped>
hr {
    @apply my-2;
}
.numberInput > span {
    @apply relative;
}
.numberInput > span >span {
    @apply absolute top-[50%] translate-y-[-50%] left-3 text-primary pointer-events-none;
}

.numberInput > span > input {
    @apply pl-8
}

</style>

<template>
    <div class="p-4 min-w-[15rem]">
        <h4 class="mb-4">Camera Settings</h4>
        <div class="flex flex-col gap-2 mt-2">
            <div>
                <p class="mb-2">Preset</p>
                <DropDown
                    :options="['Default', 'Pseudo-isometric', ...presets.map(x => x.name)]"
                    :default-option="isPreset ? _name : 'Custom'"
                    :on-click="onClick"
                    :on-open-context-menu="onOpenContextMenu">
                    <template #input="{ open, isOpen, selectedOption }">
                        <div @click="open" tabindex="0" :class="`select-none border-grad-light hover:border-primary ${isOpen ? '!border-primary' : ''} border p-2 rounded text-grad-dark`">
                            {{ selectedOption }}
                        </div>
                    </template>
                    <template #contextMenu="{ target, close }">
                        <Btn no-background @click="deletePreset({ name: target }), close()">Remove</Btn>
                    </template>
                </DropDown>
            </div>
            <hr>
            <div class="mb-2">
                <p class="mb-2">Position</p>
                <p class="flex gap-2 numberInput">
                    <span><span>X</span><input type="number" min="-300" max="300" v-model="_position[0]"></span>
                    <span><span>Y</span><input type="number" min="-300" max="300" v-model="_position[1]"></span>
                    <span><span>Z</span><input type="number" min="-300" max="300" v-model="_position[2]"></span>
                </p>
            </div>
            <div class="mb-2">
                <p class="mb-2">Target</p>
                <p class="flex gap-2 numberInput">
                    <span><span>X</span><input type="number" min="-300" max="300" v-model="_target[0]"></span>
                    <span><span>Y</span><input type="number" min="-300" max="300" v-model="_target[1]"></span>
                    <span><span>Z</span><input type="number" min="-300" max="300" v-model="_target[2]"></span>
                </p>
            </div>
            <Tooltip tooltip="How wide the angle of view is.">
                <div class="mb-2">
                    <p class="mb-2">Field of view</p>
                    <p class="flex"><Slider :show-value="false" :min="5" :max="150" v-model="fov"/><input type="number" min="5" max="150" v-model="_fov"></p>
                </div>
            </Tooltip>
            <div>
                <p class="mb-2">Name</p>
                <p class="flex justify-between">
                    <input @keydown.stop @keydup.stop type="text" size="16" maxlength="16" placeholder="New Preset" v-model="_name">
                    <Btn class="font-medium text-sm" v-if="isValidName(_name)" @click="addPreset">Add preset</Btn>
                    <Btn class="font-medium text-sm" v-else tooltip="A preset with this name already exists" :disabled="true">Add preset</Btn>
                </p>
            </div>
        </div>
        <Hotkey name="x-pos-camera" :handler="() => hotkeyPreset('x-pos')" :data="{ code: 'KeyA' }"/>
        <Hotkey name="x-neg-camera" :handler="() => hotkeyPreset('x-neg')" :data="{ code: 'KeyD' }"/>
        <Hotkey name="z-pos-camera" :handler="() => hotkeyPreset('z-pos')" :data="{ code: 'KeyW' }"/>
        <Hotkey name="z-neg-camera" :handler="() => hotkeyPreset('z-neg')" :data="{ code: 'KeyS' }"/>
        <Hotkey name="y-pos-camera" :handler="() => hotkeyPreset('y-pos')" :data="{ code: 'KeyQ' }"/>
        <Hotkey name="y-neg-camera" :handler="() => hotkeyPreset('y-neg')" :data="{ code: 'KeyE' }"/>
    </div>
</template>