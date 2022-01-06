<template>
    <div class="md:w-1/2 w-auto">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Settings</h3>
            <div class="my-4">
                <p>Settings may need reloading to apply properly.</p>
                <p><input type="checkbox" v-model="builderSettings.useSAO"/> Use Screen-space Ambient Occlusion</p>
                <p><input type="checkbox" v-model="builderSettings.useRealAA"/> Use Anti-Aliasing</p>
                <p><input type="checkbox" v-model="builderSettings.showBorders"/> Show briq borders</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.planeColor"/> Base Plane Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.gridColor"/> Grid Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="builderSettings.backgroundColor"/> Background Color</p>
            </div>
            <Btn @click="resetToDefault">Reset to defaults</Btn>
            <Btn class="mx-2" @click="resetToLast" :disabled="!mayUndo">Undo changes</Btn>
        </div>
    </div>
</template>

<script lang="ts">
import { resetStore } from '../../../builder/graphics/Settings';
import builderSettings from '../../../builder/graphics/Settings';

var initState;

import { defineComponent, nextTick } from 'vue';
export default defineComponent({
    data() {
        return {
            builderSettings,
            mayUndo: false,
        };
    },
    emits: ["close"],
    mounted() {
        initState = JSON.parse(JSON.stringify(this.builderSettings));
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
