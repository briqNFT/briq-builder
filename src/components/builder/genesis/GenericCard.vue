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
.item-card p {
    @apply text-copy;
}
</style>

<template>
    <div :class="'item-card relative ' + status">
        <div class="bg-white rounded-md gap-1 shadow-sm">
            <template v-if="status === 'LOADED'">
                <p class="flex-1 min-h-0 min-w-0 flex justify-center items-center my-4">
                    <img class="min-h-0 min-w-0 max-h-[10rem]" :src="imageSrc">
                </p>
                <h3 class="font-medium text-md px-4">{{ title }} </h3>

                <div v-if="status === 'LOADED'" class="px-4 text-sm flex justify-between">{{ subtitle }}</div>
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
