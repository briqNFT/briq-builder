<script setup lang="ts">
import MiddleModal from './MiddleModal.vue';
</script>

<template>
    <div class="absolute top-0 left-0 h-screen w-screen invisible">
        <MiddleModal v-for="data, index in store.modals" :key="index" :data="data" :class="(onlyShowLast ? (index === store.modals.length - 1 ? '' : 'hidden') : '')">
        </MiddleModal>
    </div>
</template>

<script lang="ts">
import { reactive, markRaw } from 'vue';

let store = reactive({
    modals: [],
    onlyShowLast: false,
});

export async function pushModal(modal: any, metadata?: any)
{
    let result = await new Promise((res) => {
        let data = markRaw({
            modal,
            metadata,
            callback: res,
        });
        store.modals.push(data);
    });
    // TODO maybe: this assumes FIFO
    store.modals.pop();
    return result;
}

export async function setOnlyShowLast(value: boolean)
{
    store.onlyShowLast = value;
}

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return store
    },
    methods: {
    }
})
</script>
