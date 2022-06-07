<script setup lang="ts">
import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import type { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { markRaw, onBeforeMount, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';
import Tooltip from '@/components/generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { pushModal } from '../Modals.vue';
import { useBooklet } from './BookletComposable';
import ExportSetBookletVue from './modals/ExportSetBooklet.vue';

const currentPage = ref(1)

const store = useStore();

const onMint = async () => {
    await pushModal(ExportSetBookletVue, { set: store.state.builderData.currentSet });
}

const {
getImgSrc,
    shapeValidity,
    booklet,
    bookletData,
} = useBooklet();
</script>

<template>
    <div v-if="booklet" class="absolute top-0 bottom-0 right-0 pointer-events-none flex flex-col alternate-buttons m-4">
        <div class="grow basis-[6rem]"></div>
        <div class="pointer-events-auto bg-base rounded-md p-4 pb-6 flex-col flex items-center gap-2 relative">
            <template v-if="!!bookletData">
                <Tooltip :tooltip="`Construction progress: ${Math.floor(shapeValidity*100)}%`">
                    <div class="progress-bar absolute left-0 bottom-0 rounded-b-md bg-red-600 h-4 w-full border-t-4 border-white">
                        <div v-if="shapeValidity < 1" class="progress-bar absolute left-0 top-0 rounded-b-md rounded-r-md bg-green-600 h-3" :style="{ width: `${shapeValidity*100}%`}"></div>
                        <div v-else=""                class="progress-bar absolute left-0 top-0 rounded-b-md bg-green-600 h-3" :style="{ width: `${shapeValidity*100}%`}"></div>
                    </div>
                </Tooltip>
                <h2>{{ bookletData.name }}</h2>
                <p>Eye Hint</p>
                <img :src="getImgSrc(booklet, currentPage)">
                <p class="w-full"><Slider :min="1" :max="+bookletData.nb_pages || 1" v-model="currentPage"/></p>
                <Btn class="w-[10rem] my-1" :disabled="shapeValidity < 1" @click="onMint">Mint</Btn>
            </template>
            <template v-else="">
                <p>Loading booklet data</p>
                <p><i class="fas fa-spinner animate-spin"/></p>
            </template>
        </div>
        <div class="grow basis-[6rem]"></div>
    </div>
</template>
