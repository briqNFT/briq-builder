<script setup lang="ts">
import { notificationsManager } from '@/Notifications';

const notifs = notificationsManager.notifications;
</script>

<template>
    <div v-if="notifs.length">
        <component
            v-for="notif, i of notifs" :key="i" :is="notif.render()" :notif="notif"/>
    </div>
    <div v-else>
        <p class="px-4 py-2 text-darkest select-none text-sm">You don't have any notifications</p>
    </div>
</template>