<script setup lang="ts">
import MenuDropdown from './generic/MenuDropdown.vue';
import NotificationsList from './NotificationsList.vue';
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