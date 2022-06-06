<script setup lang="ts">
import { inputStore } from '@/builder/inputs/InputStore';

import { camera } from '@/builder/graphics/Builder';
import { orbitControls } from '@/builder/graphics/Builder';

import { hexUuid } from '@/Uuid';

import Slider from '@/components/generic/Slider.vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import { pushModal } from '@/components/Modals.vue';
import CameraCustomPresetVue from './CameraCustomPreset.vue';
import { usePresetHelpers } from './CameraComposable';
import { pushMessage } from '@/Messages';

const {
    presets,
    editing,
    editingName,
    fov,
    isValidName,
    usePreset,
    deletePreset,
    renamePreset,
    resetCamera,
    resetToPseudoIso,
    centerCamera,
} = usePresetHelpers();

const addCustomPreset = async () => {
    let preset = await pushModal(CameraCustomPresetVue, {
        name: "New Preset",
        background: false,
        align: 'justify-end items-start'
    });
    if (!preset)
        return;
    presets.value.push({
        name: preset.name,
        position: preset.position,
        target: preset.target,
        fov: preset.fov,
    }) 
}

const addPreset = () => {
    presets.value.push({
        name: `p-${hexUuid().substr(2, 6)}`,
        position: camera.position.toArray(),
        rotation: camera.rotation.toArray(),
        target: orbitControls.controls.target.toArray(),
        fov: camera.fov,
    })
}

const doneRenaming = (accept: boolean) => {
    if (accept)
    {
        if (!isValidName(editingName.value))
        {
            pushMessage("Preset name already exists.");
            return;
        }
        presets.value.find(x => x.name === editing.value)!.name = editingName.value;
    }
    editing.value = "";
}


const selection = inputStore.selectionMgr;

// Custom directive to focus the input when clicking the edit button.
const vFocus = {
    mounted: (el: HTMLElement) => el.focus()
}

</script>


<style scoped>
.camera-input-panel > div > div {
    min-width: 7.5rem;
}
</style>


<template>
    <div class="camera-input-panel w-full">
        <div class="flex flex-col items-stretch gap-1 w-full">
            <div class="flex flex-col gap-1 w-full">
                <Btn @click="centerCamera" :disabled="!selection.selectedBriqs.length" class="leading-4">
                    Center on<br>Selection
                </Btn>
                <Btn @click="addPreset">Add view <br/>to presets</Btn>
                <Btn @click="addCustomPreset">Add custom<br/>preset</Btn>
                <Tooltip tooltip="How wide the angle of view is.">
                    <div class="bg-base rounded px-1 pt-1 pb-2 shadow-sm font-light select-none text-center leading-sm text-sm">Field Of View<br/>
                        <Slider :min="5" :max="150" v-model="fov"></Slider>
                    </div>
                </Tooltip>

                <h4 class="bg-accent rounded-md px-2 py-1 my-1 text-center font-semibold">Presets</h4>
                <Btn @click="resetCamera">Default</Btn>
                <Btn @click="resetToPseudoIso">Pseudo-<br/>Isometric</Btn>
            </div>
            <div v-for="preset in presets" :key="preset.name" class="relative">
                <div class="h-10 invisible"></div>
                <div class="overflow-visible">
                    <div class="absolute left-0 top-0 h-10 flex gap-0.5 w-full">
                        <Btn v-if="editing === preset.name" class="grow row-span-2" @click="usePreset(preset)">
                            <input type="text" class="text-sm" size="12" v-focus maxlength="12" @click.stop="" @keyup.esc="doneRenaming(false)" @keypress.enter="doneRenaming(true)" v-model="editingName"/>
                        </Btn>
                        <Btn v-else="" class="grow row-span-2 text-sm px-1" @click="usePreset(preset)">{{ preset.name }}</Btn>
                        <div class="flex flex-col gap-0.5">
                            <Btn v-if="editing === preset.name" :disabled="!isValidName(editingName)" @click="doneRenaming(true)" @keypress.enter="doneRenaming(true)"
                                class="flex justify-center items-center min-h-0 h-5 text-sm leading-none"><i class="fas fa-check"/></Btn>
                            <Btn v-else="" @click="renamePreset(preset)" class="flex justify-center items-center min-h-0 h-5 text-sm leading-none"><i class="fas fa-file-signature"/></Btn>
                            <Btn v-if="editing === preset.name" @click="doneRenaming(false)" class="flex justify-center items-center min-h-0 h-5 text-sm leading-none"><i class="fa-solid fa-arrow-rotate-left"></i></Btn>
                            <Btn v-else="" @click="deletePreset(preset)" class="flex justify-center items-center min-h-0 h-5 text-sm leading-none"><i class="fa-solid fa-ban"></i></Btn>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
