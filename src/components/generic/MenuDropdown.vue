<script setup lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
    closeOnClick?: boolean,
    noMarker?: boolean,
    menuPosition?: string,
    mustClick?: boolean,
}>(), {
    closeOnClick: true,
    noMarker: false,
    menuPosition: undefined,
    mustClick: false,
});

const opened = ref(false);

const CLOSE_AFTER_FOCUS_LOSS_DELAY = 350;
let closeTimer: any;
const willClose = () => closeTimer = setTimeout(() => opened.value = false, CLOSE_AFTER_FOCUS_LOSS_DELAY);
const dropClose = () => closeTimer && clearTimeout(closeTimer);

const dropdownButton = ref(null as unknown as HTMLElement);
const dropdownPositionCSS = computed(() => {
    if (props.menuPosition)
        return props.menuPosition;
    // This isn't actually reactive but meh
    if (dropdownButton.value.getBoundingClientRect().right > window.innerWidth / 2)
        return 'absolute right-0';
    return 'absolute left-0';
});

const closeIfOutside = (event: Event) => {
    if (!event.target || !dropdownButton.value.contains(event.target as Node))
        opened.value = false;
}
onMounted(() => {
    window.addEventListener('click', closeIfOutside, { capture: true });
});
onUnmounted(() => {
    window.removeEventListener('click', closeIfOutside, { capture: true })
});

</script>

<style scoped>
div[data-name='menu'] > :not(hr) {
    @apply mx-2;
}
</style>

<template>
    <div class="relative" ref="dropdownButton" @mouseenter="dropClose" @mouseleave="willClose">
        <Btn secondary class="h-full w-full" v-bind="$attrs" @[!mustClick&&`mouseenter`].stop="opened = true" @click.stop="opened = !opened">
            <slot name="button"/>
            <span v-if="!noMarker" :class="opened ? 'text-primary' : ''"><slot name="icon">
                <i v-if="opened" class="fa-solid fa-chevron-up"/>
                <i v-else class="fa-solid fa-chevron-down"/>
            </slot>
            </span>
        </Btn>
        <!-- Close on click so that clicking on button works as expected. -->
        <div
            v-if="opened" data-name="menu" @click.stop="closeOnClick ? opened = false : ''"
            :class="`after:absolute max-h-[90vh] overflow-auto after:top-[-1rem] after:h-4 after:w-full ${dropdownPositionCSS} my-2 flex flex-col gap-1 bg-grad-lightest shadow rounded-md py-2 w-max z-50`">
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