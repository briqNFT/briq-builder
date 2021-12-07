import { reactive, watchEffect } from 'vue';

const store = reactive({
    useSAO: true,
    useRealAA: true,
});

for (let key in store)
{
    let val = window.localStorage.getItem("setting_" + key);
    if (val)
        store[key] = JSON.parse(val);
}
export default store;

watchEffect(() => {
    for (let key in store)
        window.localStorage.setItem("setting_" + key, JSON.stringify(store[key]));
});