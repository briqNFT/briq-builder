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

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    provide: {
        hotkeyMgr: mgr,
        reportError
    },
    created()
    {
        watchEffect(() => {
            watchForDarkMode(this.$route.name === 'Landing');
        });
    }
})
</script>

<style>
</style>
