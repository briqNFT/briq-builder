<script setup lang="ts">
import { ref } from 'vue';

const opened = ref(false);

const CLOSE_AFTER_FOCUS_LOSS_DELAY = 150;
let closeTimer: any;
const willClose = () => closeTimer = setTimeout(() => opened.value = false, CLOSE_AFTER_FOCUS_LOSS_DELAY);
const dropClose = () => closeTimer && clearTimeout(closeTimer);

</script>

<template>
    <div class="relative" @pointerenter="dropClose" @pointerleave="willClose">
        <Btn secondary @click="opened = !opened">
            <slot name="button"/>
            <i v-if="opened" class="fa-solid text-accent fa-chevron-up"/>
            <i v-else class="fa-solid fa-chevron-down"/>
        </Btn>
        <div v-if="opened" class="after:absolute after:top-[-1rem] after:h-4 after:w-full absolute my-2 right-0 flex flex-col gap-1 bg-base shadow rounded-md px-2 py-2 w-max z-50">
            <slot/>
        </div>
    </div>
</template>
