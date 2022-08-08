<script setup lang="ts">
import { reactive, ref  } from 'vue';
import NotificationPopup from './NotificationPopup.vue';

const computeTopPos = () => Math.max(0, parseFloat(getComputedStyle(document.documentElement).fontSize) * 4 - window.scrollY);
const topPos = ref(computeTopPos());
window.addEventListener('scroll', () => topPos.value = computeTopPos());

interface Popup {
    _uid: any;
    type: 'info' | 'warning' | 'success' | 'error';
}

const popups = reactive([] as Popup[]);

popups.push({
    _uid: 'toto',
    'type': 'info',
})
setTimeout(() => popups.push({
    _uid: 'toto2',
    'type': 'warning',
}), 500);

setTimeout(() => popups.push({
    _uid: 'toto3',
    'type': 'success',
}), 4500);

setTimeout(() => popups.push({
    _uid: 'toto4',
    'type': 'error',
}), 5500);

const closePopup = (i: number) => popups.splice(i, 1);
</script>

<template>
    <div class="z-[1000] fixed m-4 right-0 flex flex-col gap-4" :style="{ top: `${topPos}px` }">
        <TransitionGroup name="popupfade">
            <NotificationPopup v-for="popup, i of popups" :key="popup._uid" :type="popup.type" @close="closePopup(i)">
                <template #title>
                    Bid is confirmed
                </template>
                <p>Amount: some amount</p>
                <p>Item: starkgate</p>
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