<script setup lang="ts">
import { computed, ref } from 'vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { useBooklet } from './BookletComposable';
import { useBuilder } from '@/components/builder/BuilderComposable';

const currentPage = ref(1)

const {
    currentSet,
    currentSetInfo,
} = useBuilder();

const {
    getImgSrc,
    shapeValidity,
    booklet,
    bookletData,
    minimized,
} = useBooklet();
</script>

<style scoped>
.progress-bar::after {
    content: '';
    @apply absolute left-0 top-0 w-full h-full bg-info-error rounded bg-white bg-opacity-50;
    clip-path: inset(0 0 70% 0);
}
</style>
<template>
    <div v-if="booklet && !minimized" class="mx-4 mt-1 w-fit min-w-[16rem] float-right border border-grad-light !shadow-none !text-sm rounded-md bg-grad-lightest">
        <h6 class="font-medium text-sm bg-grad-lighter bg-opacity-50 rounded-t-md px-4 py-3">Booklet</h6>
        <div>
            <template v-if="!!bookletData">
                <div class="flex px-4 py-1 text-sm font-regular justify-between items-center border-b border-grad-light">
                    <Btn no-background @click="currentPage = Math.max(currentPage - 1, 1)"><i class="fas fa-chevron-left"/></Btn>
                    <span>{{ currentPage }}/{{ +bookletData.nb_pages || 1 }}</span>
                    <Btn no-background @click="currentPage = Math.min(currentPage + 1, +bookletData.nb_pages || 1)"><i class="fas fa-chevron-right"/></Btn>
                </div>
                <div class="w-full px-4 py-3 flex justify-center items-center"><img :src="getImgSrc(booklet, currentPage)"></div>
                <div class="border-t border-grad-light px-4 py-3">
                    <p class="flex justify-between"><span>Progress</span><span class="text-right">{{ Math.floor(shapeValidity*100) }}%</span></p>
                    <div class="my-2 h-2 w-full relative bg-grad-lighter rounded">
                        <div class="progress-bar absolute left-0 top-0 h-full bg-info-warning rounded" :style="{ width: `${shapeValidity*100}%`}"/>
                    </div>
                </div>
            </template>
            <div v-else class="p-4">
                <p>Loading booklet data</p>
                <p class="text-center"><i class="fas fa-spinner animate-spin"/></p>
            </div>
        </div>
    </div>
</template>
