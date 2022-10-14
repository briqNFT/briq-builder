<script setup lang="ts">
import NotificationPopup from './NotificationPopup.vue';
import { notificationPopups } from '@/Notifications';

const closePopup = (i: number) => notificationPopups.splice(i, 1);
</script>

<template>
    <div class="z-[1000] m-4 fixed top-[4rem] right-0 flex flex-col items-end gap-4">
        <TransitionGroup name="popupfade">
            <NotificationPopup v-for="popup, i of notificationPopups" :key="popup._uid" :level="popup.level" @close="closePopup(i)">
                <template #title>
                    {{ popup.title }}
                </template>
                <component :is="popup.component"/>
            </NotificationPopup>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.popupfade-enter-from {
    transform: translateX(150%);
}
.popupfade-enter-to,
.popupfade-leave-from {
    transform: translateX(0%);
    max-height: 15rem;
}
.popupfade-leave-to {
    transform: translateX(200%);
    max-height: 0rem;
}
.popupfade-enter-active,
.popupfade-leave-active {
  transition: transform 0.5s ease, max-height 0.5s ease-in 0.2s;
}
</style>