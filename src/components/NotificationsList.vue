<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { computed } from 'vue';
import Notification from './Notification.vue';

const notifs = computed(() => notificationsManager.notifications.filter(x => x.shouldShow()));

const border = (i: number) => {
    if (i === 0)
        return 'border border-grad-light rounded-b'
    else if (i === notifs.value.length - 1)
        return 'border border-grad-light border-b-0 rounded-t'
    else
        return 'border border-grad-light border-b-0'
}

</script>

<style scoped>
p {
    @apply text-sm leading-snug;
}
</style>

<template>
    <div v-if="notifs.length" class="text-sm flex flex-col-reverse">
        <div v-for="notif, i of notifs" :key="i" class="w-full">
            <div :class="['w-full text-left relative flex justify-between p-3 select-none', border(i), notif.read ? 'text-grad-darker' : 'hover:bg-grad-light'].join(' ')" @click="notif.read = true">
                <div class="grow">
                    <Notification :notif="notif"/>
                </div>
                <p class="basis-[20px] text-right text-primary text-lg">{{ notif.read ? '' : '•' }}</p>
            </div>
        </div>
    </div>
    <div v-else>
        <p class="px-4 py-2 text-grad-darker select-none text-sm">You don't have any notifications</p>
    </div>
</template>
