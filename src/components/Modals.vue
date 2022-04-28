<script setup lang="ts">
import Modal from './Modal.vue';
</script>

<template>
    <div class="absolute top-0 left-0 h-screen w-screen invisible">
        <Modal
            v-for="(data, index) in store.modals"
            :key="data.id"
            :data="data"
            :class="onlyShowLast ? (index === store.modals.length - 1 ? '' : 'hidden') : ''"/>
    </div>
</template>

<script lang="ts">
import { reactive, markRaw } from 'vue';

let store = reactive({
    modals: [] as Array<{ modal: any; metadata: any; callback: any; id: number }>,
    onlyShowLast: false,
});

let identifier = 0;
// By default, pushModal won't push the same modal.
export async function pushModal(modal: any, metadata?: any, force?: boolean) {
    if (!force && store.modals.length && store.modals[store.modals.length - 1].modal === modal)
        return;
    let ident = ++identifier;
    let result = await new Promise((res) => {
        let data = markRaw({
            modal,
            metadata,
            callback: res,
            id: ident,
        });
        store.modals.push(data);
    });
    // TODO maybe: this assumes FIFO
    store.modals.pop();
    return result;
}

export async function setOnlyShowLast(value: boolean) {
    store.onlyShowLast = value;
}

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return store;
    },
    methods: {},
});
</script>
