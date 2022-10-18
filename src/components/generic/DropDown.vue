
<script setup lang="ts">
import { defineComponent, ref, computed, Ref, watch, toRef } from 'vue';
import Flyout from './Flyout.vue';

const props = withDefaults(defineProps<{
    options: string[],
    defaultOption?: string,
    onClick?: (option: string, selectedOption: Ref<string | undefined>) => void,
    onOpenContextMenu?: (option: string) => boolean,
    menuPosition?: string,
    closeOnClick?: boolean,
}>(), {
    defaultOption: undefined,
    onClick: undefined,
    onOpenContextMenu: undefined,
    menuPosition: undefined,
    closeOnClick: true,
});

const selectedOption = ref(undefined as string | undefined);
watch(toRef(props, 'defaultOption'), () => {
    selectedOption.value = props.defaultOption;
}, {
    immediate: true,
})

const opened = ref(false);

const contextMenuTarget = ref(null as null | HTMLElement);

const _onClick = (option: string) => {
    if (props.onClick)
        props.onClick(option, selectedOption);
    else
        selectedOption.value = option;
    if (props.closeOnClick)
        opened.value = false;
}

const _onOpenContextMenu = (event: PointerEvent, option: string) => {
    if (props.onOpenContextMenu && !props.onOpenContextMenu(option))
        return;
    contextMenuTarget.value = (event.target as HTMLElement).nextElementSibling as HTMLElement;
}

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
                <template v-else>
                    <Btn
                        no-background class="justify-between text-sm font-normal"
                        @click.prevent.stop="_onClick(option)"
                        @contextmenu.prevent.stop="(e: PointerEvent) => _onOpenContextMenu(e, option)">
                        {{ option }}<span v-if="selectedOption === option"><i class="ml-2 fas fa-check"/></span>
                    </Btn>
                    <!-- This empty div is there to teleport the context menu. -->
                    <div class="relative" :data-target="option"/>
                </template>
            </template>
            <Teleport v-if="contextMenuTarget" :to="contextMenuTarget">
                <Flyout class="!absolute z-[50] top-[-1rem] right-0">
                    <slot :target="contextMenuTarget.dataset.target" :close="() => contextMenuTarget = null" name="contextMenu"/>
                </Flyout>
            </Teleport>
        </Flyout>
    </div>
</template>

<script lang="ts">
export default defineComponent({
    // I manually declare attrs on the button
    inheritAttrs: false,
});
</script>