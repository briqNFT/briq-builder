export const DARKMODE_MEDIA = !!window.matchMedia('(prefers-color-scheme: dark)').matches;

import { reactive, watchEffect } from 'vue';

export const darkModeStore = reactive({
    forcedMode: localStorage.theme || "",
})

export function useDarkMode()
{
    return (darkModeStore.forcedMode || DARKMODE_MEDIA) === "dark";
}

watchEffect(() => {
    if (!darkModeStore.forcedMode)
        localStorage.removeItem('theme');
    else
        localStorage.theme = darkModeStore.forcedMode;

    if (useDarkMode())
        document.documentElement.classList.add('dark');
    else
        document.documentElement.classList.remove('dark');
})
