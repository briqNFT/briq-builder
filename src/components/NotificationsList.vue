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
            <div :class="`w-full text-left relative select-none ${border(i)} ${notif.read ? 'text-grad-darker' : 'hover:bg-grad-light'}`" @click="notif.read = true">
                <Notification :notif="notif" class="py-2 px-4"/>
                <i v-show="!notif.read" class="absolute right-[1.125rem] top-[1.2rem] text-right text-primary text-[0.5rem] fas fa-circle"/>
            </div>
        </div>
    </div>
    <div v-else>
        <p class="py-2 text-grad-darker select-none text-sm text-left">You don't have any notifications</p>
    </div>
</template>
