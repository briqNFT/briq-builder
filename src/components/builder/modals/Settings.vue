<template>
    <div class="md:w-1/2 xl:w-1/3 w-auto">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Settings</h3>
            <div class="my-4 settings">
                <p>Settings may need reloading to apply properly.</p>
                <p><label><input type="checkbox" v-model="builderSettings.useSAO"/> Use Screen-space Ambient Occlusion</label></p>
                <p><label><input type="checkbox" v-model="builderSettings.useRealAA"/> Use Anti-Aliasing</label></p>
                <p><label><input type="checkbox" v-model="builderSettings.showPlane"/> Show base plane</label></p>
                <p><label><input type="checkbox" :disabled="!builderSettings.showPlane" v-model="builderSettings.showGrid"/> Show base grid</label></p>
                <p><label><input type="checkbox" v-model="builderSettings.showBorders"/> Show briq borders</label></p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.planeColor"/> Base Plane Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.gridColor"/> Grid Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.backgroundColor"/> Background Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.lightColor"/> Light Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.ambientColor"/> Ambient Color</p>
                <p><select v-model="darkModeStore.forcedMode">
                    <option value="">OS Default</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                </select></p>
                <label><p class="flex items-center"><span class="inline-flex items-center font-semibold text-xs bg-accent rounded-md px-1 mr-2">11 <input type="range" min="5" step="5" max="100" v-model="builderSettings.canvasSize"/> 201</span>
                Canvas size ({{ `${builderSettings.canvasSize * 2 + 1}x${builderSettings.canvasSize * 2 + 1}` }})</p></label>
            </div>
            <Btn @click="resetToDefault">Reset to defaults</Btn>
            <Btn class="mx-2" @click="resetToLast" :disabled="!mayUndo">Undo changes</Btn>
        </div>
    </div>
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
import { resetStore } from '../../../builder/graphics/Settings';
import builderSettings from '../../../builder/graphics/Settings';
import { darkModeStore } from '../../../DarkMode';

var initState;

import { defineComponent, nextTick } from 'vue';
export default defineComponent({
    data() {
        return {
            builderSettings,
            darkModeStore,
            mayUndo: false,
        };
    },
    emits: ["close"],
    mounted() {
        initState = JSON.parse(JSON.stringify(this.builderSettings));
    },
    unmounted() {
        if (builderSettings.canvasSize != initState.canvasSize)
            this.$store.dispatch("builderData/set_canvas_size", {
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
        }
    },
    methods: {
        resetToDefault() {
            resetStore();
        },
        resetToLast() {
            for (let k in initState)
            {
                this.builderSettings[k] = initState[k];
            }
            nextTick(() => this.mayUndo = false);
        }
    }
})
</script>
