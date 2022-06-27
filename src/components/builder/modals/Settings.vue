<script setup lang="ts">
import Slider from '@/components/generic/Slider.vue'
import { computed } from 'vue';

import { featureFlags } from '@/FeatureFlags';

const canvasSize = computed({
    get: () => builderSettings.canvasSize * 2,
    set(newSize: number) {
        builderSettings.canvasSize = newSize / 2;
    },
});
</script>

<template>
    <Window class="md:!w-1/2 xl:!w-1/3 !w-auto">
        <template #title>Settings</template>
        <div class="my-4 settings">
            <p>Settings may need reloading to apply properly.</p>
            <p>
                <select v-model="builderSettings.aaLevel">
                    <option value="0">Off</option>
                    <option value="FXAA">FXAA (fast)</option>
                    <option value="SMAA">SMAA</option>
                    <option value="2">4x SSAA</option>
                    <option value="3">8x SSAA</option>
                    <option value="4">16x SSAA</option>
                </select>
                Anti-Aliasing
            </p>
            <p>
                <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" v-model="builderSettings.useSAO"/> Use Screen-space Ambient Occlusion</label>
            </p>
            <p>
                <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" v-model="builderSettings.showPlane"/> Show base plane</label>
            </p>
            <p>
                <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" :disabled="!builderSettings.showPlane" v-model="builderSettings.showGrid"/>
                    Show base grid</label>
            </p>
            <p>
                <label class="inline-flex justify-center align-center gap-1"><Toggle class="w-10" v-model="builderSettings.showBorders"/> Show briq borders</label>
            </p>
            <p class="flex flex-row items-center gap-1 my-0.5">
                <input type="color" class="p-0" v-model="builderSettings.planeColor"> Base Plane Color
            </p>
            <p class="flex flex-row items-center gap-1 my-0.5">
                <input type="color" class="p-0" v-model="builderSettings.gridColor"> Grid Color
            </p>
            <p class="flex flex-row items-center gap-1 my-0.5">
                <input type="color" class="p-0" v-model="builderSettings.backgroundColor"> Background Color
            </p>
            <p class="flex flex-row items-center gap-1 my-0.5">
                <input type="color" class="p-0" v-model="builderSettings.lightColor"> Light Color
            </p>
            <p class="flex flex-row items-center gap-1 my-0.5">
                <input type="color" class="p-0" v-model="builderSettings.ambientColor"> Ambient Color
            </p>
            <p>
                <select v-model="darkModeStore.forcedMode">
                    <option value="">OS Default</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                </select>
            </p>
            <label><p class="flex items-center gap-1">
                <Slider v-if="featureFlags.bigBuilder" class="w-[8rem]" :min="10" :step="10" :max="300" v-model="canvasSize"/>
                <Slider v-else class="w-[8rem]" :min="10" :step="10" :max="CONF.builderSettings.maxCanvasSize * 2 || 100" v-model="canvasSize"/>
                Canvas size ({{ `${builderSettings.canvasSize * 2}x${builderSettings.canvasSize * 2}` }})
            </p></label>
        </div>
        <Btn @click="resetToDefault">Reset to defaults</Btn>
        <Btn class="mx-2" @click="resetToLast" :disabled="!mayUndo">Undo changes</Btn>
    </Window>
</template>

<style scoped>
.settings * {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
</style>

<script lang="ts">
import builderSettings from '../../../builder/graphics/Settings';
import { darkModeStore, useDarkMode } from '../../../DarkMode';

import { CONF } from '@/Conf';

var initState;

import { defineComponent, nextTick, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            builderSettings,
            darkModeStore,
            forceMode: toRef(darkModeStore, 'forcedMode'),
            mayUndo: false,
        };
    },
    mounted() {
        initState = JSON.parse(JSON.stringify(this.builderSettings));
    },
    unmounted() {
        if (builderSettings.canvasSize != initState.canvasSize)
            this.$store.dispatch('builderData/set_canvas_size', {
                value: this.builderSettings.canvasSize,
                before: initState.canvasSize,
            });
    },
    watch: {
        builderSettings: {
            handler() {
                this.mayUndo = true;
            },
            deep: true,
        },
        forceMode() {
            builderSettings.onDarkModeUpdate();
        },
    },
    computed: {
        CONF() {
            return CONF;
        },
    },
    methods: {
        resetToDefault() {
            builderSettings.reset();
        },
        resetToLast() {
            for (let k in initState)
                this.builderSettings[k] = initState[k];
            nextTick(() => (this.mayUndo = false));
        },
    },
});
</script>
