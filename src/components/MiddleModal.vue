<template>
    <div v-if="modal" class="flex h-screen w-screen justify-center items-center fixed top-0 left-0" style="background: rgba(0, 0, 0, 0.3);">
        <component :metadata="metadata" :is="modal" class="visible container rounded-lg bg-briq alternate-buttons mx-auto px-8 py-4 shadow-xl relative"
            @close="close"></component>
    </div>
</template>

<script lang="ts">
import { shallowReactive } from 'vue';
var localStore = shallowReactive({
    modal: undefined as undefined | any,
    metadata: undefined as any,
    callback: false as any,
    result: undefined as any
});

export function getModal()
{
    return localStore.modal;
}

export async function setModalAndAwait(modal?: any, metadata?: any): any
{
    localStore.modal = undefined;
    localStore.metadata = metadata;
    localStore.modal = modal;
    await new Promise((res, rej) => {
        localStore.callback = res;
    });
    return localStore.result;
}

export function setModal(modal?: any, metadata?: any)
{
    localStore.modal = undefined;
    localStore.metadata = metadata;
    localStore.modal = modal;
    localStore.callback = false;
}

let escapeSC: any = undefined;

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return localStore
    },
    inject: ["hotkeyMgr"],
    mounted() {
        escapeSC = this.hotkeyMgr.subscribe("escape", () => this.close());
    },
    unmounted() {
        this.hotkeyMgr.unsubscribe(escapeSC);
    },
    methods: {
        close(data?: any) {
            if (this.callback)
            {
                this.result = data;
                this.callback();
            }
            else
                setModal();
            this.callback = false;
        },
        setModal: setModal
    }
})
</script>
