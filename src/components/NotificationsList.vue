<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { computed } from 'vue';

const notifs = computed(() => notificationsManager.notifications.filter(x => x.shouldShow()));

const icons = {
    'info': 'fa-solid fa-clock',
    'warning': 'fa-solid fa-circle-exclamation',
    'success': 'fa-solid fa-circle-check',
    'error': 'fa-solid fa-circle-xmark',
};

const border = (i: number) => {
    if (i === 0)
        return 'border border-grad-light border-b-0 rounded-b'
    else if (i === notifs.value.length - 1)
        return 'border border-grad-light border-b-0 rounded-t'
    else
        return 'border border-grad-light border-b-0'
}
</script>

<template>
    <div v-if="notifs.length" class="text-sm flex flex-col-reverse">
        <div v-for="notif, i of notifs" :key="i" class="w-full">
            <div :class="['w-full text-left relative flex justify-between p-3 select-none', border(i), notif.read ? 'text-grad-darker' : 'hover:bg-grad-light'].join(' ')" @click="notif.read = true">
                <div class="grow">
                    <h5 class="font-medium py-2">
                        <i :style="{ color: `rgb(var(--color-info-${notif.level}))` }" :class="icons[notif.level]"/> {{ notif.title }}
                    </h5>
                    <template v-if="notif.type === 'text'">
                        <p>{{ notif.data }}</p>
                    </template>
                    <template v-else-if="notif.type === 'tentative_bid'"/>
                    <template v-else-if="notif.type === 'confirmed_bid'"/>
                    <template v-else-if="notif.type === 'pending_bid'"/>
                    <template v-else-if="notif.type === 'rejected_bid'"/>
                    <p class="text-xs text-grad-dark mt-2 flex justify-between">
                        <span>{{ new Date(notif.timestamp).toLocaleString("en-uk", { dateStyle: "long", timeStyle: "short" }) }}</span>
                        <span v-if="notif.data.tx_hash"><a :href="`https://goerli.voyager.online/tx/${notif.data.tx_hash}`" target="_blank" class="text-primary">TX</a></span>
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
