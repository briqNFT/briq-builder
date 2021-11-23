<template>
    <div class="flex h-screen w-screen justify-center items-center fixed top-0 left-0 invisible">
        <component :metadata="metadata" :is="modal" class="visible container rounded-lg bg-briq-light mx-auto w-3/4 px-8 py-4 shadow-xl relative"
            @close="setModal()"></component>
    </div>
</template>

<script lang="ts">
import { shallowReactive } from 'vue';
var localStore = shallowReactive({
    modal: undefined as undefined | any,
    metadata: undefined as any
});

export function setModal(modal?: any, metadata?: any)
{
    localStore.modal = undefined;
    localStore.metadata = metadata;
    localStore.modal = modal;
}

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return localStore
    },
    methods: {
        setModal: setModal
    }
})
</script>
