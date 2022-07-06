<script setup lang="ts">
import { defineComponent, ref } from 'vue';

const opened = ref(false);

const CLOSE_AFTER_FOCUS_LOSS_DELAY = 450;
let closeTimer: any;
const willClose = () => closeTimer = setTimeout(() => opened.value = false, CLOSE_AFTER_FOCUS_LOSS_DELAY);
const dropClose = () => closeTimer && clearTimeout(closeTimer);

</script>

<style scoped>
div[data-name='menu'] {
    @apply bg-red-200;
}
</style>

<template>
    <div class="relative" @pointerenter="dropClose" @pointerleave="willClose">
        <Btn secondary class="h-full w-full" v-bind="$attrs" @click="opened = !opened">
            <slot name="button"/>
            <span :class="opened ? 'text-accent' : ''"><slot name="icon">
                <i v-if="opened" class="fa-solid fa-chevron-up"/>
                <i v-else class="fa-solid fa-chevron-down"/>
            </slot>
            </span>
        </Btn>
        <!-- Close on click so that clicking on button works as expected. -->
        <div v-if="opened" data-name="menu" @click="opened = false" class="after:absolute after:top-[-1rem] after:h-4 after:w-full absolute my-2 right-0 flex flex-col gap-1 bg-base shadow rounded-md px-2 py-2 w-max z-50">
            <slot/>
        </div>
    </div>
</template>

<script lang="ts">
export default defineComponent({
    // I manually declare attrs on the button
    inheritAttrs: false,
});
</script>