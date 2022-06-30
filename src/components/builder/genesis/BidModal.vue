<script setup lang="ts">
import { ref, watch } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
defineEmits(['close']);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'PROCESSING' | 'BID_COMPLETE');

watch(step, (nv, _) => {
    if (nv === 'PROCESSING')
        setTimeout(() => {
            step.value = 'BID_COMPLETE';
        }, 2500);
})
</script>

<template>
    <WindowVue v-if="step === 'MAKE_BID'" :size="'md:w-[40rem]'">
        <template #big-title>Place a bid</template>
        <div class="flex flex-col gap-8">
            <div class="flex flex-col items-center gap-2">
                <p class="text-md">Current winning bid</p>
                <p class="text-lg font-semibold">1.35 <i class="fa-brands fa-ethereum"/></p>
            </div>
            <div>
                <p>
                    Make your bid<br>
                    <input class="w-full my-2" :placeholder="`Bid Ξ ${1.35} or more`">
                </p>
                <p class="text-right text-sm text-darkest">Available: Ξ 2.35</p>
            </div>
            <div class="flex justify-end gap-4">
                <Btn secondary @click="$emit('close')">Cancel</Btn>
                <Btn @click="step = 'PROCESSING'">Place a bid</Btn>
            </div>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'PROCESSING'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction processing</template>
        <div class="flex flex-col gap-8">
            <p>
                Your transaction has been sent and should be confirmed shortly.
                You can check the status of your transaction from the profile dropdown.
            </p>

            <p>See transaction on <a href="">Voyager</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction complete <i class="fa-regular fa-circle-check"/></template>
        <div class="flex flex-col gap-8">
            <p>Your bid of {{ 3.24 }} <i class="fa-brands fa-ethereum"/> is confirmed.</p>
            <p>Come back in X hours and check if you've won!</p>

            <p>See transaction on <a href="">Voyager</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
</template>