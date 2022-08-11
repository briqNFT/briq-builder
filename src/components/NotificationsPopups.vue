<script setup lang="ts">
import { h, ref  } from 'vue';
import NotificationPopup from './NotificationPopup.vue';
import { notificationPopups, pushPopup } from './NotificationsComposable';

const computeTopPos = () => Math.max(0, parseFloat(getComputedStyle(document.documentElement).fontSize) * 4 - window.scrollY);
const topPos = ref(computeTopPos());
window.addEventListener('scroll', () => topPos.value = computeTopPos());

pushPopup('info', 'Some information');
setTimeout(() => pushPopup('warning', 'Some random warning'), 500);
setTimeout(() => pushPopup('success', 'This however is a success'), 4500);
setTimeout(() => pushPopup('error', h('p', 'This a direct component error')), 5500);

const closePopup = (i: number) => notificationPopups.splice(i, 1);
</script>

<template>
    <div class="z-[1000] fixed m-4 right-0 flex flex-col items-end gap-4" :style="{ top: `${topPos}px` }">
        <TransitionGroup name="popupfade">
            <NotificationPopup v-for="popup, i of notificationPopups" :key="popup._uid" :type="popup.type" @close="closePopup(i)">
                <template #title>
                    Bid is confirmed
                </template>
                <p v-if="typeof popup.message === 'string'" class="break-all whitespace-pre">{{ popup.message }}</p>
                <component v-else :is="popup.message"/>
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