
<script setup lang="ts">
import { defineComponent, ref, computed, Ref, watch } from 'vue';
import Flyout from './Flyout.vue';

const props = withDefaults(defineProps<{
    options: string[],
    defaultOption?: string,
    onClick?: (option: string, selectedOption: Ref<string | undefined>) => void,
    menuPosition?: string,
    closeOnClick?: boolean,
}>(), {
    defaultOption: undefined,
    onClick: undefined,
    menuPosition: undefined,
    closeOnClick: true,
});


const selectedOption = ref(props.defaultOption || undefined);

const opened = ref(false);

const _onClick = (option: string) => {
    if (props.onClick)
        props.onClick(option, selectedOption);
    else
        selectedOption.value = option;
    if (props.closeOnClick)
        opened.value = false;
}

const CLOSE_AFTER_FOCUS_LOSS_DELAY = 250000;
let closeTimer: any;
const willClose = () => closeTimer = setTimeout(() => opened.value = false, CLOSE_AFTER_FOCUS_LOSS_DELAY);
const dropClose = () => closeTimer && clearTimeout(closeTimer);

const dropdownDiv = ref(null as unknown as HTMLElement);
const dropdownPositionCSS = computed(() => {
    if (!dropdownDiv.value)
        return {};
    if (props.menuPosition)
        return props.menuPosition;
    // This isn't actually reactive but meh
    const pos = dropdownDiv.value.getBoundingClientRect();
    if (pos.right > window.innerWidth / 2)
        return { right: '0px', minWidth: `${pos.width}px` };
    return { left: '0px', minWidth: `${pos.width}px` };
});

</script>

<style scoped>
.menu > :not(hr) {
    @apply mx-2;
}
</style>

<template>
    <div class="relative" ref="dropdownDiv">
        <slot :selected-option="selectedOption" :is-open="opened" :open="() => opened = !opened" name="input"/>
        <Flyout v-show="opened" v-bind="$attrs" class="menu w-max my-1 z-50 flex flex-col !absolute py-2" :style="dropdownPositionCSS">
            <template v-for="option, i in options" :key="i">
                <hr v-if="option === ''" class="my-2">
                <Btn v-else no-background class="justify-between" @click="_onClick(option)">{{ option }}<span v-if="selectedOption === option"><i class="ml-2 fas fa-check"/></span></Btn>
            </template>
        </Flyout>
    </div>
</template>

<script lang="ts">
export default defineComponent({
    // I manually declare attrs on the button
    inheritAttrs: false,
});
</script>