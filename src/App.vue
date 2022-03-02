<script setup lang="ts">
import GA from './components/GA.vue';
import { HotkeyManager } from './Hotkeys';
</script>

<template>
    <GA/>
    <router-view/>
</template>

<script lang="ts">
import { reportError } from './Monitoring';
// Import dark mode
import { watchForDarkMode } from './DarkMode';

let mgr = new HotkeyManager();

// Some basic hotkeys available everywhere
mgr.register("escape", { code: "Escape" });

import { setForceDebug } from './Messages';

import { featureFlags } from "./FeatureFlags";

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    provide: {
        hotkeyMgr: mgr,
        reportError,
        featureFlags
    },
    created()
    {
        watchEffect(() => {
            watchForDarkMode(this.$route.name !== 'Builder' && this.$route.name !== 'Share');
        });
    },
    mounted() {
        let params = (new URL(window.location)).searchParams;
        if (params.get("debug"))
            setForceDebug();
    }
})
</script>

<style>
</style>
