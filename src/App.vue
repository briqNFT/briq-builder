<script setup lang="ts">
import GA from '@/components/GA.vue';
import { HotkeyManager } from './Hotkeys';
import { reportError } from './Monitoring';
import { setForceDebug } from './Messages';
import { watchForDarkMode } from './DarkMode';
import { useRoute } from 'vue-router';

import { onMounted, provide, watch, watchEffect } from 'vue';

import { CONF } from './Conf';
import NotificationsPopups from './components/NotificationsPopups.vue';
import Modals from './components/Modals.vue';
import CursorTooltip from './components/generic/CursorTooltip.vue';
import Mainnet from './components/Mainnet.vue';

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
    <NotificationsPopups/>
    <Modals/>
    <CursorTooltip/>
    <Mainnet/>
</template>

<style>
body {
    @apply bg-background min-h-screen;
    @apply text-text-on-background font-sans font-normal leading-tight;
    @apply antialiased;
}

h1 {
    @apply text-max font-semibold;
}

h2 {
    @apply text-2xl font-semibold;
}

h3 {
    @apply text-xl font-semibold;
}

h4 {
    @apply text-lg font-semibold;
}

h5 {
    @apply text-sm font-semibold;
}

h6 {
    @apply text-xs font-semibold;
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


input:not([type='color']), textarea, select {
    @apply rounded px-4 py-2 border border-grad-light;
    @apply text-grad-dark focus:text-grad-darker disabled:text-grad-light;
    &:not(:disabled):hover, &:focus, &:focus-visible {
        @apply border-primary outline-0;
    }

    &:focus {
        @apply shadow-[0_0_3px_black] shadow-primary-lighter;
    }
}

input[type='color'] {
    @apply p-0 m-0 w-6 h-6 rounded bg-transparent border-none;
}

select {
    @apply px-2;
}

/* Hack for get-starknet */
body > div.s-dialog {
    z-index: 1000 !important;
}
body > div.s-overlay {
    z-index: 500 !important;
}
</style>
