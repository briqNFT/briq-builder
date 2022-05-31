<script setup lang="ts">
import { usePresetHelpers } from '../inputs/CameraComposable';
import CameraVue from '../inputs/Camera.vue';

const {
    presets,
    usePreset,
    resetCamera,
    centerCamera,
} = usePresetHelpers();

</script>

<template>
    <div>
        <h2 class="visible text-center text-[5rem] opacity-50 pointer-events-none">SCREENSHOTTING</h2>
        <teleport to="#inputComp">
            <div class="flex flex-col my-4 gap-1">
                <Btn @click="returnScreen"><i class="fas fa-camera"/> Take Screenshot</Btn>
                <Btn @click="$emit('close')"><i class="fas fa-ban"/> Cancel</Btn>
            </div>

            <CameraVue/>

            <div class="flex flex-col my-4 gap-1 w-full">
                <Btn @click="openSettings">Open Settings</Btn>
                <Btn v-if="!builderSettings.transparentBackground" @click="builderSettings.transparentBackground = true">
                    Set transparent<br>background
                </Btn>
                <Btn v-if="builderSettings.transparentBackground" @click="builderSettings.transparentBackground = false">
                    Set opaque<br>background
                </Btn>
            </div>
        </teleport>
    </div>
</template>

<script lang="ts">
import { takeScreenshot } from '@/builder/graphics/Builder';
import { inputStore } from '@/builder/inputs/InputStore';
import { pushModal, setOnlyShowLast } from '@/components/Modals.vue';
import SettingsVue from './Settings.vue';

import builderSettings from '@/builder/graphics/Settings';

import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            oldInput: '',
            screenshot: '',
            screenshotPromise: undefined as Promise<string> | undefined,
            builderSettings,
        };
    },
    mounted() {
        this.oldInput = inputStore.currentInput;
        // Switch to camera mode, which has no fancy feature.
        builderInputFsm.switchTo('camera');
        inputStore.hideInput = true;
        // Hide the modal itself (the teleported stuff isn't affected)
        this.$emit('hide');
        setOnlyShowLast(true);
    },
    unmounted() {
        builderInputFsm.switchTo(this.oldInput);
        inputStore.hideInput = false;
        setOnlyShowLast(false);
        this.builderSettings.transparentBackground = false;
    },
    props: ['metadata'],
    emits: ['close', 'hide', 'show'],
    computed: {
        selection() {
            return inputStore.selectionMgr;
        },
        fsmState() {
            return builderInputFsm.gui;
        },
    },
    methods: {
        putAllInView() {
            dispatchBuilderAction('put_all_in_view');
        },
        centerCamera() {
            dispatchBuilderAction('set_camera_target', {
                target: [this.fsmState.focusPos.x, this.fsmState.focusPos.y, this.fsmState.focusPos.z],
            });
        },
        takeScreen() {
            let uri = takeScreenshot();
            let img = new Image();
            img.src = uri;
            this.screenshotPromise = new Promise((resolve: (data: string) => void) => {
                img.decode().then(() => {
                    this.screenshot = img.src;
                    resolve(this.screenshot);
                });
            });
        },
        async returnScreen() {
            this.takeScreen();
            this.$emit('close', await this.screenshotPromise!);
        },
        openSettings() {
            pushModal(SettingsVue, { background: 'rgba(0, 0, 0, 0.1)', align: 'justify-end items-start' });
        },
    },
});
</script>
