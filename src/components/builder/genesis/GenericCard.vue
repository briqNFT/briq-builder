<script setup lang="ts">
defineProps<{
    imageSrc: string | undefined,
    title: string | undefined,
    subtitle: string | undefined,
    status: 'LOADED' | 'ERROR' | 'FETCHING',
}>();

</script>


<style scoped>
.item-card > div {
    @apply flex flex-col relative top-0 transition-all;
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
        <div class="bg-white rounded-md gap-1 shadow-sm h-full">
            <template v-if="status === 'LOADED'">
                <p class="min-h-0 min-w-0 flex justify-center items-center p-4 h-[12rem]">
                    <img class="min-h-0 min-w-0" :src="imageSrc">
                </p>
                <h3 class="font-medium text-md px-4 break-all">{{ title }} </h3>

                <div class="px-4 text-sm flex justify-between">{{ subtitle }}</div>
                <slot name="subtitle"/>
                <template v-if="$slots.content">
                    <hr class="my-2">
                    <div class="p-4 pt-0 flex flex-col gap-2">
                        <slot name="content"/>
                    </div>
                </template>
            </template>
            <template v-else-if="status === 'ERROR'">
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-times"/><span>Error while loading data</span></p>
            </template>
            <template v-else>
                <p class="w-full h-full flex flex-col gap-4 justify-center items-center"><i class="fas fa-spinner animate-spin"/><span>Loading</span></p>
                <!-- prefetch -->
                <img class="hidden" :src="imageSrc">
            </template>
        </div>
    </div>
</template>
