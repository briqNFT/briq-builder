<script setup lang="ts">
import GA from '@/components/GA.vue';
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

import { CONF } from './Conf';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    provide: {
        hotkeyMgr: mgr,
        reportError,
        CONF
    },
    created()
    {
        document.documentElement.classList.add(CONF.theme);
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
