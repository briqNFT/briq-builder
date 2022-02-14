<template>
    <div class="fixed bottom-0 left-0 px-4 py-2" style="z-index: 1000">
        <p class="bg-base rounded-2xl my-2 px-2 text-lg font-normal">
            <button @click="openLog" class="min-w-[0.7rem]">+</button> 
            {{ lastMessage }}
        </p>
    </div>
</template>

<style scoped>
</style>
<script lang="ts">
import { messagesStore } from '../Messages'
import { pushModal } from './Modals.vue';

import MessagesLog from './MessagesLog.vue';

import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            messages: toRef(messagesStore, "messages"),
            lastMessage: undefined as undefined | string,
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
                this.timeoutLM = setTimeout(() => { this.lastMessage = undefined; }, 6000);
            }
        }
    },
    methods: {
        openLog: function() {
            pushModal(MessagesLog);
        }
    }
})
</script>
