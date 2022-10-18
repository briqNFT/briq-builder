<script setup lang="ts">
import Slider from '@/components/generic/Slider.vue'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { nextTick } from 'vue';

import { featureFlags } from '@/FeatureFlags';

import builderSettings from '@/builder/graphics/Settings';
import { darkModeStore } from '@/DarkMode';

import { CONF } from '@/Conf';
import { useStore } from 'vuex';
import InputColor from '../generic/InputColor.vue';

const store = useStore();
let initState: typeof builderSettings;

const mayUndo = ref(false);
onMounted(() => initState = JSON.parse(JSON.stringify(builderSettings)));
watch(builderSettings, () => mayUndo.value = true, { deep: true });

const resetToDefault = () => builderSettings.reset();
const resetToLast = () => {
    for (let k in initState)
        builderSettings[k] = initState[k];
    nextTick(() => (mayUndo.value = false));
}
</script>


<style scoped>
.settings * {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.root > div > *:not(hr) {
    @apply px-4;
}
hr {
    @apply my-2;
}
.settings > div {
    @apply flex flex-col gap-1;
}

#app button {
    @apply justify-start;
}
</style>


<template>
    <div class="root">
        <h4 class="mt-4 px-4">Settings</h4>
        <div class="mt-4 mb-2 settings flex flex-col gap-2">
            <div>
                <p>Anti-aliasing</p>
                <p>
                    <select v-model="builderSettings.aaLevel">
                        <option value="0">Off</option>
                        <option value="FXAA">FXAA (fast)</option>
                        <option value="SMAA">SMAA</option>
                        <option value="2">4x SSAA</option>
                        <option value="3">8x SSAA</option>
                        <option value="4">16x SSAA</option>
                    </select>
                </p>
            </div>
            <hr>
            <div>
                <p>
                    <label class="w-full inline-flex justify-between items-center gap-1">Show briq borders <Toggle class="w-10" v-model="builderSettings.showBorders"/></label>
                </p>
                <p class="mt-3">
                    <label class="w-full inline-flex justify-between items-center gap-1">Screen-space Ambient Occlusion <Toggle class="w-10" v-model="builderSettings.useSAO"/></label>
                </p>
            </div>
            <hr>
            <p>Dark mode</p>
            <p>
                <select v-model="darkModeStore.forcedMode">
                    <option value="">OS Default</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                </select>
            </p>
            <hr>
            <div class="!px-2">
                <Btn no-background class="font-normal text-sm py-2" @click="resetToDefault">Reset to defaults</Btn>
                <Btn no-background class="font-normal text-sm py-2" @click="resetToLast" :disabled="!mayUndo">Undo changes</Btn>
            </div>
        </div>
    </div>
</template>
