<template>
    <div class="md:w-1/2 w-auto">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Settings</h3>
            <div class="my-4">
                <p><input type="checkbox" v-model="useSAO"/> Use Screen-space Ambient Occlusion</p>
                <p><input type="checkbox" v-model="useRealAA"/> Use Anti-Aliasing</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import builderSettings from '../../../builder/graphics/Settings';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return builderSettings;
    },
    emits: ["close"],
})
</script>
