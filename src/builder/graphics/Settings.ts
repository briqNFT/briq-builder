import { reactive, watchEffect, markRaw } from 'vue';

import { useDarkMode } from '../../DarkMode';

const store = reactive({
    useSAO: false,
    useRealAA: true,
    planeColor: useDarkMode() ? "#591f00" : "#a93a00",
    gridColor: useDarkMode() ? "#999999" : "#eaeaea",
    backgroundColor: useDarkMode() ? "#1e2229" : "#eaeaea",
    showBorders: false,
    showPlane: true,
    showGrid: true,
    transparentBackground: false,
    canvasSize: 10,
});

export function resetStore() {
    store.useSAO = false;
    store.useRealAA = true;
    store.planeColor = useDarkMode() ? "#591f00" : "#a93a00";
    store.gridColor = useDarkMode() ? "#999999" : "#eaeaea";
    store.backgroundColor = useDarkMode() ? "#1e2229" : "#eaeaea";
    store.showBorders = false;
    store.showPlane = true;
    store.showGrid = true;
    store.transparentBackground = false;
    store.canvasSize = 10;
}

for (let key in store)
{
    if (key === "transparentBackground")
        continue;

    let val = window.localStorage.getItem("setting_" + key);
    if (val)
        store[key] = JSON.parse(val);
}
export default store;

watchEffect(() => {
    for (let key in store)
        window.localStorage.setItem("setting_" + key, JSON.stringify(store[key]));
});