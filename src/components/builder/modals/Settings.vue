<template>
    <div class="md:w-1/2 w-auto">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Settings</h3>
            <div class="my-4">
                <p>Settings may need reloading to apply properly.</p>
                <p><input type="checkbox" v-model="useSAO"/> Use Screen-space Ambient Occlusion</p>
                <p><input type="checkbox" v-model="useRealAA"/> Use Anti-Aliasing</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="planeColor"/> Base Plane Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="gridColor"/> Grid Color</p>
                <p class="flex flex-row items-center gap-1 my-0.5"><input type="color" class="p-0" v-model="backgroundColor"/> Background Color</p>
            </div>
            <Button @click="reset">Reset to defaults</Button>
        </div>
    </div>
</template>

<script lang="ts">
import { resetStore } from '../../../builder/graphics/Settings';
import builderSettings from '../../../builder/graphics/Settings';

import Button from '../../generic/Button.vue';
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return builderSettings;
    },
    emits: ["close"],
    components: { Button },
    methods: {
        reset() {
            resetStore();
        }
    }
})
</script>
