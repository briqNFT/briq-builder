<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { computed } from 'vue';

const notifs = computed(() => notificationsManager.notifications.filter(x => x.shouldShow()));
</script>

<template>
    <div v-if="notifs.length" class="text-sm flex flex-col-reverse">
        <div v-for="notif, i of notifs" :key="i" class="w-full">
            <div :class="['w-full text-left relative flex justify-between rounded-sm p-2', notif.read ? 'text-grad-darker' : 'hover:bg-grad-light'].join(' ')" @click="notif.read = true">
                <div class="grow">
                    <component :is="notif.component" :data="notif.data"/>
                    <p class="text-xs text-grad-darker">
                        {{ notif.timestamp }}
                    </p>
                </div>
                <p class="basis-[20px] text-right text-primary text-lg">{{ notif.read ? '' : '•' }}</p>
            </div>
        </div>
    </div>
    <div v-else>
        <p class="px-4 py-2 text-grad-darker select-none text-sm">You don't have any notifications</p>
    </div>
</template>
