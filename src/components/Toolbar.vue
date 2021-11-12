<script setup lang="ts">
import Debug from './Tools/Debug.vue'
import SetInfo from './Tools/SetInfo.vue'
import WipSets from './Tools/WipSets.vue'

var isProd = import.meta.env.PROD;
</script>

<template>
    <div class="toolbar">
        <SetInfo/>
        <WipSets/>
        <Debug v-if="!isProd"/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({ 
});
</script>

<style scoped>
.toolbar
{
    display: flex;
    flex-wrap: wrap;

    overflow: scroll;

    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    background: rgba(0, 0, 0, 0.1);
    border-left: 1px solid gray;
}
.toolbar > div
{
    background: rgba(255, 255, 255, 0.1);
    flex-basis: 1;
    margin:1rem;
    padding:0.5rem;
    width: 100%;
}
</style>