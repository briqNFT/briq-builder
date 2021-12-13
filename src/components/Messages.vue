<script setup lang="ts">
</script>

<template>
    <div class="fixed bottom-0 left-0 px-4 py-2" style="z-index: 1000">
        <button @click="openLog">+</button><p class="text-lg font-normal drop-shadow-md">{{ lastMessage ? lastMessage : tooltip }}</p>
    </div>
</template>

<style>
</style>

<script lang="ts">
import { messagesStore } from '../Messages'
import { setModal } from './MiddleModal.vue';

import MessagesLog from './MessagesLog.vue';

import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            tooltip: toRef(messagesStore, "tooltip"),
            messages: toRef(messagesStore, "messages"),
            lastMessage: undefined as undefined | string,
            timeoutLM: undefined as undefined | number,
        }
    },
    watch: {
        messages: {
            deep: true,
            // NB: doesn't really work passing old value here anyways, but I don't particularly care
            handler: function(newV)
            {
                // A new message has been pushed: show it for a few seconds then switch to tooltips again.
                this.lastMessage = newV[newV.length - 1];
                if (this.timeoutLM)
                    clearTimeout(this.timeoutLM);
                this.timeoutLM = setTimeout(() => { this.lastMessage = undefined; }, this.tooltip ? 2000: 6000);
            }
        }
    },
    methods: {
        openLog: function() {
            setModal(MessagesLog);
        }
    }
})
</script>
