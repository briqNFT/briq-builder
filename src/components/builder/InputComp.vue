<script setup lang="ts">
//import PickMaterial from "./PickMaterial.vue";
import Place from './inputs/Place.vue';
import Inspect from './inputs/Inspect.vue';
</script>

<template>
    <component :is="mapping[inputComp]"></component>
</template>

<script lang="ts">
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            inputComp: toRef(inputStore, "currentInput"),
            mapping: {
                "place": Place,
                "paint": Place,
                "inspect": Inspect
            }
        };
    }
})
</script>

<style scoped>
</style>
