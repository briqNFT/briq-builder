<script setup lang="ts">
import GA from './components/GA.vue';
import { HotkeyManager } from './Hotkeys';
import { appendFile } from 'fs';
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
import { CONF } from './Conf';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    provide: {
        hotkeyMgr: mgr,
        reportError,
        featureFlags,
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

<style>
html.realms.realms {
    --color-base: 141 121 91;
    --color-accent: 22 22 25;
    --color-darker: 50 20 0;
    --color-text: 220 220 220;
    --color-text-on-accent: 220 220 220;
}
html.realms.realms.dark {
    --color-base: 22 22 25;
    --color-accent: 141 121 91;
    --color-darker: 50 20 0;
    --color-text: 220 220 220;
    --color-text-on-accent: 220 220 220;
}

</style>
