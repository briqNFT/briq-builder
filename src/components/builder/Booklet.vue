<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed'
import punkUrl from '@/assets/genesis/punk.pdf?url'
import { ref } from 'vue';
import Slider from '../generic/Slider.vue';

const currentPage = ref(1)

const pdf = ref(VuePdfEmbed.getDocument(punkUrl));
const nPages = ref(1);
pdf.value.promise.then(x => {
    nPages.value = x.numPages
});

const pdfRef = ref(null);

</script>

<template>
    <div class="absolute top-0 bottom-0 right-0 pointer-events-none flex flex-col alternate-buttons m-4">
        <div class="grow basis-[6rem]"></div>
        <div class="pointer-events-auto bg-base rounded-md p-4 flex-col flex items-center gap-2">
            <h2>Some Booklet</h2>
            <p>Eye Hint</p>
            <div v-if="!!pdf">
                <VuePdfEmbed
                    ref="pdfRef"
                :source="punkUrl" :page="+currentPage" :disable-text-layer="true" :disable-annotation-layer="true"></VuePdfEmbed>
            </div>
            <p class="w-full"><Slider :min="1" :max="nPages || 1" v-model="currentPage"/></p>
            <Btn class="w-[10rem] my-1" :disabled="true">Mint</Btn>
        </div>
        <div class="grow basis-[6rem]"></div>
    </div>
</template>
