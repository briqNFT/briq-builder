<script setup lang="ts">
import Debug from './Tools/Debug.vue'
import SetInfo from './Tools/SetInfo.vue'
import WipSets from './Tools/WipSets.vue'

var isProd = import.meta.env.PROD;
</script>

<template>
    <div :class="{ toolbar: true, shouldShow: shouldShow || !showOnHover }">
        <button style="position:absolute; top:0; right:0;" @click="showOnHover = !showOnHover">{{ showOnHover ? "Always show" : "Show when hovering" }}</button>
        <SetInfo/>
        <WipSets/>
        <Debug v-if="!isProd"/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
            showOnHover: true
        };
    },
    props: ["shouldShow"]
});
</script>

<style scoped>
.toolbar
{
    display: flex;
    flex-wrap: wrap;

    overflow: scroll;

    position: fixed;
    top: 300px;
    right: -300px;
    width: 300px;
    height: calc(100vh - 200px);
    background: rgba(0, 0, 0, 0.1);
    border-left: 1px solid gray;
}
.toolbar.shouldShow
{
    right: 0;
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