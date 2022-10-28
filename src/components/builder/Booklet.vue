<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { useBooklet } from './BookletComposable';
import { useBuilder } from '@/components/builder/BuilderComposable';
import ProgressBar from '../generic/ProgressBar.vue';
import BookletStepRenderer from './genesis/BookletStepRenderer.vue';
import { camera } from '@/builder/graphics/Builder';

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


const cpos = ref(undefined);
const crot = ref(undefined);
onMounted(() => {
    setInterval(() => {
        cpos.value = camera.position.clone();
        crot.value = camera.quaternion.clone();
    }, 250,
    )
});
</script>

<template>
    <div v-if="booklet && !minimized" class="mx-1 sm:mx-2 sm:mt-2 w-fit min-w-[16rem] float-right border border-grad-light !shadow-none !text-sm rounded-md bg-grad-lightest">
        <h6 class="font-medium text-sm bg-grad-lighter bg-opacity-50 rounded-t-md px-4 py-3">Booklet</h6>
        <div>
            <template v-if="!!bookletData">
                <div class="flex px-4 py-1 text-sm font-normal justify-between items-center border-b border-grad-light">
                    <Btn no-background class="w-10" @click="currentPage = Math.max(currentPage - 1, 1)"><i class="fas fa-chevron-left"/></Btn>
                    <span>{{ currentPage }}/{{ +bookletData.nb_pages || 1 }}</span>
                    <Btn no-background class="w-10" @click="currentPage = Math.min(currentPage + 1, +bookletData.nb_pages || 1)"><i class="fas fa-chevron-right"/></Btn>
                </div>
                <div class="relative px-4 py-3 flex justify-center items-center pointer-events-auto w-[400px] h-[300px]" style="transform:scale(0.5)">
                    <BookletStepRenderer :glb_name="booklet" :i="currentPage - 1"/>
                </div>
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
