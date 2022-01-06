<template>
    <div class="fixed bottom-0 left-0 px-4 py-2" style="z-index: 1000">
        <button @click="openLog" class="flex justify-center items-center bg-briq" style="border-radius:50%;width:1.2rem;height:1.2rem;">+</button>
        <p class="bg-briq rounded-2xl my-2 px-2 text-lg font-normal">{{ lastMessage ? lastMessage : tooltip }}</p>
    </div>
</template>

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

<style scoped>
.tshadow {
    text-shadow: 0 0 2px rgb(0, 0, 0, 0.6);
}
</style>