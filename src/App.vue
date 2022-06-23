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


html h1 {
    @apply text-max font-medium;
}

html h2 {
    @apply text-xl font-medium;
}

html h3 {
    @apply text-lg font-medium;
}


html:not(.v2design) body {
    @apply font-light;
}

html:not(.v2design) h1 {
    @apply text-max font-medium;
}

html:not(.v2design) h2 {
    @apply text-4xl font-medium;
}

html:not(.v2design) h3 {
    @apply text-xl font-normal;
}

.briq-logo {
    @apply font-logo font-medium select-none text-accent tracking-wide;
}

.briq-logo.briq {
    @apply bg-accent text-white px-5 leading-none pt-[0.4rem] pb-[0.6rem] rounded-[2px];
}

/* Overwrite the default outline color */
html:not(.v2design) button, a {
    @apply focus-visible:outline-none focus-visible:ring focus-visible:ring-darker;
}
html.v2design button, a {
    @apply focus-visible:outline-none focus-visible:ring focus-visible:ring-accent;
}


html:not(.v2design) input, select, textarea {
    @apply rounded-sm px-2 py-0.5 bg-white text-black dark:bg-darker dark:text-text;
}

html.v2design input {
    @apply rounded p-4 border-2 border-darker;
    @apply disabled:text-darker;
}

html.v2design input:not(:disabled):hover, html.v2design input:focus, html.v2design input:focus-visible {
    @apply border-accent outline-0;
}

html.v2design input:focus {
    @apply shadow-[0_0_3px_black] shadow-light-accent;
}

/* Hack for get-starknet */
body > div.s-dialog {
    z-index: 1000 !important;
}
body > div.s-overlay {
    z-index: 500 !important;
}
</style>
