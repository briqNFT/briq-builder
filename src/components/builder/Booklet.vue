<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useStore } from 'vuex';
import Tooltip from '@/components/generic/Tooltip.vue';
import Slider from '../generic/Slider.vue';
import { pushModal } from '../Modals.vue';
import { useBooklet } from './BookletComposable';
import ExportSetBookletVue from './modals/ExportSetBooklet.vue';
import { useBuilder } from '@/builder/BuilderStore';
import ProfileVue from '../profile/Profile.vue';
import WindowVue from '../generic/Window.vue';

const currentPage = ref(1)

const store = useStore();

const minimized = ref(false);

const onMint = async () => {
    await pushModal(ExportSetBookletVue, { set: store.state.builderData.currentSet });
}

const {
    getImgSrc,
    shapeValidity,
    bookletData,
} = useBooklet();

const { currentSetInfo } = useBuilder();
const booklet = computed(() => currentSetInfo.value.booklet);

const openProfile = () => {
    pushModal(h(WindowVue, {
        size:'w-full',
    }, {
        'big-title': () => 'Booklets',
        'content': () => h(ProfileVue),
    }));
}
</script>

<template>
    <div v-if="booklet" class="absolute top-0 bottom-0 right-0 pointer-events-none flex flex-col alternate-buttons m-4">
        <div class="grow basis-[6rem]"/>
        <div v-if="minimized" class="pointer-events-auto rounded border-dashed border-4 border-base relative text-base px-2 pb-2">
            <button class="text-xs px-2 mb-2 leading-none" @click="minimized = false">Expand<br>booklet</button>
            <img class="m-auto h-12" :src="getImgSrc(booklet, bookletData.nb_pages)">
        </div>
        <div v-else-if="!minimized" class="pointer-events-auto bg-base rounded p-4 pb-6 flex-col flex items-center gap-2 relative">
            <div class="absolute w-full top-0 flex justify-between text-xs gap-2 px-2">
                <button @click="openProfile">Change Booklet</button>
                <button @click="minimized = true">Minimize</button>
            </div>
            <template v-if="!!bookletData">
                <Tooltip :tooltip="`Construction progress: ${Math.floor(shapeValidity*100)}%`">
                    <div class="progress-bar absolute left-0 bottom-0 rounded-b-md bg-red-600 h-4 w-full border-t-4 border-white">
                        <div v-if="shapeValidity < 1" class="progress-bar absolute left-0 top-0 rounded-b-md rounded-r-md bg-green-600 h-3" :style="{ width: `${shapeValidity*100}%`}"/>
                        <div v-else="" class="progress-bar absolute left-0 top-0 rounded-b-md bg-green-600 h-3" :style="{ width: `${shapeValidity*100}%`}">
                            <p class="text-center text-xs leading-none tracking-wide font-semibold">Complete!</p>
                        </div>
                    </div>
                </Tooltip>
                <h2>{{ bookletData.name }}</h2>
                <p>Eye Hint</p>
                <img :src="getImgSrc(booklet, currentPage)">
                <p class="w-full"><Slider :min="1" :max="+bookletData.nb_pages || 1" v-model="currentPage"/></p>
                <Btn class="w-[10rem] my-1" :disabled="shapeValidity < 1" @click="onMint">Mint</Btn>
            </template>
            <template v-else>
                <p>Loading booklet data</p>
                <p><i class="fas fa-spinner animate-spin"/></p>
            </template>
        </div>
        <div class="grow basis-[6rem]"/>
    </div>
</template>
