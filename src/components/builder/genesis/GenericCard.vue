<script setup lang="ts">
import Tooltip from '@/components/generic/Tooltip.vue';

defineProps<{
    title: string | undefined,
    subtitle?: string,
    status: 'LOADED' | 'ERROR' | 'FETCHING',
    imageSrc?: string | undefined,
    imageBg?: string,
    showPendingMarker?: boolean
}>();

</script>


<style scoped>
.item-card > div {
    @apply flex flex-col relative top-0 transition-all duration-300;
}
.item-card:hover > div {
    @apply top-[-0.25rem];
}
#app .item-card:not(.ERROR):hover > div {
    @apply shadow-lg;
}
.item-card p, .item-card :slotted(p) {
    @apply text-copy;
}
.item-card :slotted(.attribute) {
    @apply text-copy text-grad-dark;
}
</style>

<template>
    <div :class="'item-card relative h-full' + status">
        <div class="bg-white rounded-md gap-2 shadow-sm h-full">
            <template v-if="showPendingMarker">
                <Tooltip tooltip="Some items of this type have pending transactions. Transaction failure could lead to UI changes.">
                    <div
                        class="absolute top-4 left-4 select-none z-10 rounded bg-info-info bg-opacity-10 text-sm text-info-info px-2 py-1">
                        Pending
                    </div>
                </Tooltip>
            </template>
            <template v-if="status === 'LOADED'">
                <!-- Because we have gap-2 we need to remove 8px from bottom margin -->
                <slot name="image"/>
                <template v-if="!$slots.image">
                    <p :class="`rounded-md overflow-hidden min-h-0 min-w-0 flex justify-center items-center m-4 mb-2 h-[13rem] ${imageBg ?? ''}`">
                        <img class="min-h-0 min-w-0 max-h-full max-w-full" :src="imageSrc">
                    </p>
                </template>
                <h3 class="font-semibold text-md px-4 overflow-x-auto">{{ title }} </h3>

                <div v-if="!$slots.subtitle" class="px-4 flex justify-between text-sm leading-none py-[1px]">{{ subtitle }}</div>
                <slot name="subtitle"/>
                <template v-if="$slots.content">
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <slot name="content"/>
                    </div>
                </template>
            </template>
            <template v-else-if="status === 'ERROR'">
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-xmark"/><span>Error while loading data</span></p>
            </template>
            <template v-else>
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-spinner animate-spin"/><span>Loading</span></p>
                <!-- prefetch -->
                <img class="hidden" :src="imageSrc">
            </template>
        </div>
    </div>
</template>
