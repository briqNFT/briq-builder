<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { computed } from 'vue';
import MenuDropdown from './generic/MenuDropdown.vue';
import NotificationsList from './NotificationsList.vue';

const hasUnreadNotifications = computed(() => notificationsManager.notifications.some(x => x.shouldShow() && !x.read));
</script>

<template>
    <MenuDropdown no-background class="min-w-[3rem]">
        <template #icon>
            <i class="fa-regular fa-bell"/>
            <span class="text-primary absolute top-2 right-2 text-lg" v-if="hasUnreadNotifications">•</span>
        </template>
        <NotificationsList class="p-4 min-w-[26rem]"/>
    </MenuDropdown>
</template>