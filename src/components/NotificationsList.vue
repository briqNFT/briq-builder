<script setup lang="ts">
import { notificationsManager } from '@/Notifications';
import { ref, computed } from 'vue';

const notifs = computed(() => notificationsManager.notifications.filter(x => x.shouldShow()));

const details = ref(undefined as undefined | number);
</script>

<template>
    <div v-if="notifs.length" class="text-sm flex flex-col-reverse">
        <div v-for="notif, i of notifs" :key="i" class="w-full">
            <div :class="['w-full text-left relative flex justify-between rounded-sm p-2', notif.read ? 'text-grad-darker' : 'hover:bg-grad-light'].join(' ')" @click="notif.read = true">
                <div class="grow">
                    <p>{{ notif.summary }}</p>
                    <p class="text-xs text-grad-darker">
                        {{ notif.timestamp }}
                        <Btn v-if="details !== i" no-background class="text-xs min-h-0" @click.stop="details = i">See details</Btn>
                        <Btn v-else no-background class="text-xs min-h-0" @click.stop="details = undefined">Hide details</Btn>
                        <Btn v-if="notif.read" no-background class="z-1 text-xs min-h-0" @click.stop="notif.read = false">Mark unread</Btn>
                    </p>
                </div>
                <p class="basis-[20px] text-right text-primary text-lg">{{ notif.read ? '' : '•' }}</p>
            </div>
            <div v-if="details === i" class="bg-gray-100 p-2 border-t border-grad-darker rounded-b-md w-full">
                <component :is="notif.render()" :notif="notif"/>
            </div>
        </div>
    </div>
    <div v-else>
        <p class="px-4 py-2 text-grad-darker select-none text-sm">You don't have any notifications</p>
    </div>
</template>
