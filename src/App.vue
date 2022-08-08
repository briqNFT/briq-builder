<script setup lang="ts">
import GA from '@/components/GA.vue';
import { HotkeyManager } from './Hotkeys';
import { reportError } from './Monitoring';
import { setForceDebug } from './Messages';
import { watchForDarkMode } from './DarkMode';
import { useRoute } from 'vue-router';

import { onMounted, provide, watch, watchEffect } from 'vue';

import { CONF } from './Conf';

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
    document.documentElement.classList.add('v2design');
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
    @apply bg-background min-h-screen;
    @apply text-text-on-background font-sans font-normal leading-tight;
}

html h1 {
    @apply text-max font-semibold;
}

html h2 {
    @apply text-xl font-semibold;
}

html h3 {
    @apply text-lg font-semibold;
}


.briq-logo {
    @apply font-logo font-medium select-none text-primary tracking-wide;
}

.briq-logo.briq {
    @apply bg-primary text-white px-5 leading-none pt-[0.4rem] pb-[0.6rem] rounded-[2px];
}

html button, a {
    @apply focus-visible:outline-none focus-visible:ring focus-visible:ring-primary;
}


html input {
    @apply rounded p-4 border-2 border-grad-light;
    @apply disabled:text-grad-light;
}

html input:not(:disabled):hover, html input:focus, html input:focus-visible {
    @apply border-primary outline-0;
}

html input:focus {
    @apply shadow-[0_0_3px_black] shadow-primary-lighter;
}

/* Hack for get-starknet */
body > div.s-dialog {
    z-index: 1000 !important;
}
body > div.s-overlay {
    z-index: 500 !important;
}
</style>
