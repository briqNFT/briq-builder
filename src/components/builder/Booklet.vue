<script setup lang="ts">
import { computed, ref } from 'vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { useBooklet } from './BookletComposable';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ProgressBar from '../generic/ProgressBar.vue';

const currentPage = ref(1)

const {
    currentSet,
    currentSetInfo,
} = useBuilder();

const {
    getStepImgSrc,
    shapeValidity,
    booklet,
    bookletData,
    minimized,
} = useBooklet();
</script>

<template>
    <div v-if="booklet && !minimized" class="mx-1 sm:mx-2 sm:mt-2 w-fit min-w-[16rem] float-right border border-grad-light !shadow-none !text-sm rounded-md bg-grad-lightest">
        <h6 class="font-medium text-sm bg-grad-lighter bg-opacity-50 rounded-t-md px-4 py-3">Booklet</h6>
        <div>
            <template v-if="!!bookletData">
                <div class="flex px-4 py-1 text-sm font-regular justify-between items-center border-b border-grad-light">
                    <Btn no-background class="w-10" @click="currentPage = Math.max(currentPage - 1, 1)"><i class="fas fa-chevron-left"/></Btn>
                    <span>{{ currentPage }}/{{ +bookletData.nb_pages || 1 }}</span>
                    <Btn no-background class="w-10" @click="currentPage = Math.min(currentPage + 1, +bookletData.nb_pages || 1)"><i class="fas fa-chevron-right"/></Btn>
                </div>
                <div class="w-full px-4 py-3 flex justify-center items-center"><img :src="getStepImgSrc(booklet, currentPage)"></div>
                <div class="border-t border-grad-light px-4 py-3">
                    <p class="flex justify-between"><span>Progress</span><span class="text-right">{{ Math.floor(shapeValidity*100) }}%</span></p>
                    <ProgressBar :percentage="shapeValidity*100"/>
                </div>
            </template>
            <div v-else class="p-4">
                <p>Loading booklet data</p>
                <p class="text-center"><i class="fas fa-spinner animate-spin"/></p>
            </div>
        </div>
    </div>
</template>
