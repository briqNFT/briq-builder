<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { computed } from 'vue';
import MenuDropdown from './generic/MenuDropdown.vue';
import NotificationsList from './NotificationsList.vue';

const hasUnreadNotifications = computed(() => notificationsManager.notifications.some(x => x.shouldShow() && !x.read));
</script>

<template>
    <MenuDropdown no-background modal-background :close-on-click="false" :must-click="true" class="min-w-[2.5rem]">
        <template #icon>
            <i class="fa-regular fa-bell"/>
            <span class="text-primary absolute top-2 right-2 text-lg" v-if="hasUnreadNotifications">•</span>
        </template>
        <template #default="{ close }">
            <h4 class="p-2 text-left font-medium flex justify-between">
                Notifications
                <span><Btn no-background @click="close" class="w-6 h-6 p-0 text-lg inline-flex justify-center items-center"><i class="fas fa-times"/></Btn></span>
            </h4>
            <NotificationsList class="mx-4 my-2 mt-0 min-w-[26rem]"/>
        </template>
    </MenuDropdown>
</template>