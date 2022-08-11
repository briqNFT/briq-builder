<script setup lang="ts">
import Flyout from '@/components/generic/Flyout.vue';
</script>

<template>
    <div>
        <h2 class="visible text-center text-[5rem] opacity-50 pointer-events-none">SCREENSHOTTING</h2>
        <teleport to="#sidebar">
            <Flyout>
                <div class="flex flex-col gap-1 p-2 mt-2">
                    <Btn primary icon class="justify-start text-sm" @click="returnScreen"><i class="fas fa-camera"/> Take Screenshot</Btn>
                    <Btn secondary icon class="justify-start text-sm" @click="$emit('close')"><i class="fas fa-ban"/> Cancel</Btn>
                    <Btn no-background class="justify-start text-sm" @click="builderSettings.transparentBackground = !builderSettings.transparentBackground">
                        {{ builderSettings.transparentBackground ? 'Show' : 'Hide' }} background
                    </Btn>
                    <Btn no-background class="justify-start text-sm" @click="openSettings">Open Settings</Btn>
                </div>
            </Flyout>
        </teleport>
    </div>
</template>

<script lang="ts">
import { takeScreenshot } from '@/builder/graphics/Builder';
import { inputStore } from '@/builder/inputs/InputStore';
import { pushModal, setOnlyShowLast } from '@/components/Modals.vue';
import SettingsVue from '@/components/builder/Settings.vue';

import builderSettings from '@/builder/graphics/Settings';

import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { defineComponent, h } from 'vue';
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
            pushModal(h(ModalComponentVue, { title: 'Settings', component: SettingsVue, size: 'w-max' }), { background: 'rgba(0, 0, 0, 0.1)', align: 'justify-end items-start' });
        },
    },
});import ModalComponentVue from '@/components/generic/ModalComponent.vue';

</script>
