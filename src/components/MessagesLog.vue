<template>
    <div class="w-1/2">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Messages log</h3>
            <p v-for="mess in messages">{{ mess }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import { messagesStore } from '../Messages'

import { defineComponent, toRef } from "vue";
export default defineComponent({
    data() {
        return {
            messages: toRef(messagesStore, "messages"),
        }
    },
});
</script>