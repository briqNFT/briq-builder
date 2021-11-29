<script setup lang="ts">
import PickMaterial from "./PickMaterial.vue";
import PickColor from './PickColor.vue';
</script>

<template>
    <div id="sideBar" class="flex flex-wrap flex-col px-5 py-20 absolute left-0 top-0 h-full w-20 justify-center">
        <div>
            <template v-if="inputStore.currentInput === 'place' || inputStore.currentInput === 'paint'">
                <PickColor/>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
            inputStore
        };
    }
})
</script>

<style scoped>
button {
    @apply btn my-2 w-full;
}
</style>
