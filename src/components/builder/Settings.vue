<script setup lang="ts">
import Slider from '@/components/generic/Slider.vue'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { nextTick } from 'vue';

import { featureFlags } from '@/FeatureFlags';

import builderSettings from '@/builder/graphics/Settings';
import { darkModeStore } from '@/DarkMode';

import { CONF } from '@/Conf';
import { useStore } from 'vuex';

const store = useStore();

const canvasSize = computed({
    get: () => builderSettings.canvasSize * 2,
    set(newSize: number) {
        builderSettings.canvasSize = newSize / 2;
    },
});

let initState: typeof builderSettings;

const mayUndo = ref(false);
onMounted(() => initState = JSON.parse(JSON.stringify(builderSettings)));
onUnmounted(() => {
    if (builderSettings.canvasSize != initState.canvasSize)
        store.dispatch('builderData/set_canvas_size', {
            value: builderSettings.canvasSize,
            before: initState.canvasSize,
        });
}),
watch(builderSettings, () => mayUndo.value = true, { deep: true });
watchEffect(() => builderSettings.onDarkModeUpdate());

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
.root > *:not(hr) {
    @apply px-4;
}
.settings > div > div {
    @apply flex flex-col gap-1;
}

#app button {
    @apply justify-start;
}
</style>


<template>
    <div class="root">
        <h3>Settings</h3>
        <div class="my-4 settings">
            <p class="text-grad-dark text-xs italic">Some settings may need reloading to apply properly.</p>
            <div class="flex flex-col gap-2">
                <div>
                    <h4>Anti-aliasing</h4>
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
                    <h4>Base plane</h4>
                    <p>
                        <input type="color" class="p-0" v-model="builderSettings.planeColor"><label>Base plane<Toggle class="w-10" v-model="builderSettings.showPlane"/></label>
                    </p>
                    <p>
                        <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" :disabled="!builderSettings.showPlane" v-model="builderSettings.showGrid"/>
                            Show base grid</label>
                    </p>
                    <p class="flex flex-row items-center gap-1 my-0.5">
                        Base Plane Color
                    </p>
                    <p class="flex flex-row items-center gap-1 my-0.5">
                        <input type="color" class="p-0" v-model="builderSettings.gridColor"> Grid Color
                    </p>
                </div>
                <hr>
                <div>
                    <p>
                        <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" v-model="builderSettings.useSAO"/> Use Screen-space Ambient Occlusion</label>
                    </p>
                    <p>
                        <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" v-model="builderSettings.showBorders"/> Show briq borders</label>
                    </p>
                </div>
                <hr>
                <div>
                    <h4>Canvas size</h4>
                    <label><p class="flex items-center gap-1">
                        <Slider v-if="featureFlags.bigBuilder" class="w-[6rem]" :min="10" :step="10" :max="300" v-model="canvasSize"/>
                        <Slider v-else class="w-[6rem]" :min="10" :step="10" :max="CONF.builderSettings.maxCanvasSize * 2 || 100" v-model="canvasSize"/>
                        Canvas size ({{ `${builderSettings.canvasSize * 2}x${builderSettings.canvasSize * 2}` }})
                    </p></label>
                </div>
                <hr>
                <div>
                    <p class="flex flex-row items-center gap-1 my-0.5">
                        <input type="color" class="p-0" v-model="builderSettings.backgroundColor"> Background Color
                    </p>
                    <p class="flex flex-row items-center gap-1 my-0.5">
                        <input type="color" class="p-0" v-model="builderSettings.lightColor"> Light Color
                    </p>
                    <p class="flex flex-row items-center gap-1 my-0.5">
                        <input type="color" class="p-0" v-model="builderSettings.ambientColor"> Ambient Color
                    </p>
                </div>
                <hr>
                <p>
                    <select v-model="darkModeStore.forcedMode">
                        <option value="">OS Default</option>
                        <option value="dark">Dark Mode</option>
                        <option value="light">Light Mode</option>
                    </select>
                </p>
                <hr>
                <div>
                    <Btn no-background @click="resetToDefault">Reset to defaults</Btn>
                    <Btn no-background @click="resetToLast" :disabled="!mayUndo">Undo changes</Btn>
                </div>
            </div>
        </div>
    </div>
</template>
