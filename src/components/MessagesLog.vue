<template>
    <Window @close="$emit('close')" class="w-1/2">
        <template #big-title>Messages log</template>
        <p v-if="!messages.length">No messages yet</p>
        <p v-for="mess in messages">{{ mess }}</p>
    </Window>
</template>

<script lang="ts">
import { messagesStore } from '../Messages';

import { defineComponent, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            messages: toRef(messagesStore, 'messages'),
        };
    },
});
</script>
