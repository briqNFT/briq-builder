<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
    closeOnClick?: boolean,
    position?: 'auto' | 'bl' | 'br' | ((el: HTMLElement) => Record<string, any>),
    delay?: number | false,
}>(), {
    closeOnClick: true,
    position: 'auto',
    delay: 500,
});

const opened = ref(false);

let closeTimer: any;
const willClose = () => {
    if (!props.delay)
        return;
    closeTimer = setTimeout(() => opened.value = false, props.delay)
};
const dropClose = () => closeTimer && clearTimeout(closeTimer);

const menuButton = ref(null as unknown as HTMLElement);
const menuItem = ref(null as unknown as HTMLElement);

const refreshToggle = ref(0);
const menuPosition = computed(() => {
    if (!menuButton.value || !menuItem.value)
        return undefined;

    // Manual refresh;
    refreshToggle.value;

    if (typeof props.position === 'function')
        return props.position(menuItem.value);

    let appRect = document.getElementById('app')!.getBoundingClientRect();
    let button = menuButton.value.getBoundingClientRect();

    // window condition isn't actually reactive but meh
    if (props.position === 'auto' && button.right > window.innerWidth / 2 || props.position === 'br')
        return {
            position: 'absolute',
            right: appRect.right - button.right + 'px',
            top: button.bottom - appRect.top + 'px',
        }
    else if (props.position === 'auto' || props.position === 'bl')
        return {
            position: 'absolute',
            left: button.left - appRect.left + 'px',
            top: button.bottom - appRect.top + 'px',
        }
    else
        throw new Error(`Invalid position ${props.position}`);
});

const closeIfOutside = (event: Event) => {
    if (!event.target || !(menuButton.value?.contains(event.target as Node) || menuItem.value?.contains(event.target as Node)))
        opened.value = false;
}
const refreshOnResize = () => {
    refreshToggle.value++;
}
onMounted(() => {
    window.addEventListener('resize', refreshOnResize, { capture: true })
    // Unstoppable handler to close the menu if the user clicks outside of our frame.
    // This mimics Mac os behaviour and feels natural to me.
    window.addEventListener('click', closeIfOutside, { capture: true });
});
onUnmounted(() => {
    window.removeEventListener('resize', refreshOnResize, { capture: true })
    window.removeEventListener('click', closeIfOutside, { capture: true })
});
</script>

<template>
    <div ref="menuButton" @mouseleave="willClose" @mouseenter="dropClose" v-bind="$attrs">
        <slot name="button" :open="() => opened = !opened">
            <Btn secondary class="h-full w-full" @click.stop="opened = !opened">
                <span :class="opened ? 'text-primary' : ''"><slot name="icon">
                    <i v-if="opened" class="fa-solid fa-chevron-up"/>
                    <i v-else class="fa-solid fa-chevron-down"/>
                </slot>
                </span>
            </Btn>
        </slot>
    </div>
    <Teleport to="#app">
        <div ref="menuItem" v-show="opened" @click="closeOnClick ? opened = false : ''" @mouseleave="willClose" @mouseenter="dropClose" :style="menuPosition">
            <slot/>
        </div>
    </Teleport>
</template>
