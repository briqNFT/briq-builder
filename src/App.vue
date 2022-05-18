<script setup lang="ts">
import GA from '@/components/GA.vue';
import { HotkeyManager } from './Hotkeys';
import { reportError } from './Monitoring';

import { provide } from 'vue';

import { CONF } from './Conf';

let mgr = new HotkeyManager();
// Some basic hotkeys available everywhere
mgr.register('escape', { code: 'Escape' });

provide('hotkeyMgr', mgr);
provide('reportError', reportError);
provide('CONF', CONF);
</script>

<template>
    <GA/>
    <router-view/>
</template>

<script lang="ts">
// Import dark mode
import { watchForDarkMode } from './DarkMode';

import { setForceDebug } from './Messages';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    created() {
        document.documentElement.classList.add(CONF.theme);
        watchEffect(() => {
            watchForDarkMode(this.$route.name !== 'Builder' && this.$route.name !== 'Share');
        });
    },
    mounted() {
        let params = new URL(window.location).searchParams;
        if (params.get('debug'))
            setForceDebug();
    },
});
</script>
