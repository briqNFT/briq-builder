<script setup lang="ts">
import PickColor from './PickColor.vue';
</script>

<template>
    <div id="sideBar" class="flex flex-wrap flex-col px-5 py-20 absolute left-0 top-0 h-full w-20 justify-center">
        <PickColor/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({});
</script>

<style scoped>
</style>