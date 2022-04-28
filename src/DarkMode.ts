export const DARKMODE_MEDIA = !!window.matchMedia('(prefers-color-scheme: dark)').matches;

import { reactive, watchEffect, WatchStopHandle } from 'vue';

export const darkModeStore = reactive({
    forcedMode: localStorage.theme || '',
});

export function useDarkMode() {
    return darkModeStore.forcedMode ? darkModeStore.forcedMode === 'dark' : DARKMODE_MEDIA;
}

let stopHandle: WatchStopHandle | undefined;

export function watchForDarkMode(forceLight?: boolean) {
    stopHandle?.();
    stopHandle = watchEffect(() => {
        if (!darkModeStore.forcedMode)
            localStorage.removeItem('theme');
        else
            localStorage.theme = darkModeStore.forcedMode;

        if (useDarkMode() && !forceLight)
            document.documentElement.classList.add('dark');
        else
            document.documentElement.classList.remove('dark');
    });
}
