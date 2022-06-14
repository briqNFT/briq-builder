<script setup lang="ts">
import GA from '@/components/GA.vue';
import { HotkeyManager } from './Hotkeys';
import { reportError } from './Monitoring';
import { setForceDebug } from './Messages';
import { watchForDarkMode } from './DarkMode';

import { onMounted, provide, watch, watchEffect } from 'vue';

import { CONF } from './Conf';
import { useRoute } from 'vue-router';

let mgr = new HotkeyManager();
// Some basic hotkeys available everywhere
mgr.register('escape', { code: 'Escape' });

provide('hotkeyMgr', mgr);
provide('reportError', reportError);
provide('CONF', CONF);

const route = useRoute();

document.documentElement.classList.add(CONF.theme);
watchEffect(() => {
    watchForDarkMode(route.name !== 'Builder' && route.name !== 'Share');
});

watch([() => route.name as unknown as string], (_, __) => {
    if (route.name !== 'Builder' && route.name !== 'Share')
        document.documentElement.classList.add('v2design');
    else
        document.documentElement.classList.remove('v2design');
}, {
    immediate: true,
});

onMounted(() => {
    let params = new URL(window.location).searchParams;
    if (params.get('debug'))
        setForceDebug();
});
</script>

<template>
    <GA/>
    <router-view/>
</template>

<style>
body {
    @apply bg-body min-h-screen;
    @apply text-text font-sans font-normal leading-tight;
}

h1 {
    @apply text-max font-medium;
}

h2 {
    @apply text-4xl font-medium;
}

h3 {
    @apply text-xl font-normal;
}

.briq-logo {
    @apply font-logo font-medium select-none text-accent tracking-wide mx-4;
}

.briq-logo.briq {
    @apply bg-accent text-white px-5 leading-none pt-[0.4rem] pb-[0.6rem];
}

/* Overwrite the default outline color */
button, a {
    @apply focus-visible:outline-none focus-visible:ring focus-visible:ring-darker;
}

input, select, textarea {
    @apply rounded px-2 py-0.5 bg-white text-black dark:bg-darker dark:text-text;
}
</style>
