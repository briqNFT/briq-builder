// matchMedia is optional so that it works in JSDOM's test environment.
export const DARKMODE_MEDIA = !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;

import { reactive, watchEffect, WatchStopHandle } from 'vue';

export const darkModeStore = reactive({
    userChoice: localStorage.theme || '',
});

export function useDarkMode() {
    return darkModeStore.userChoice ? darkModeStore.userChoice === 'dark' : DARKMODE_MEDIA;
}

let stopHandle: WatchStopHandle | undefined;

export function watchForDarkMode(forceLight?: boolean) {
    stopHandle?.();
    stopHandle = watchEffect(() => {
        if (!darkModeStore.userChoice)
            localStorage.removeItem('theme');
        else
            localStorage.theme = darkModeStore.userChoice;

        if (useDarkMode() && !forceLight)
            document.documentElement.classList.add('dark');
        else
            document.documentElement.classList.remove('dark');
    });
}
