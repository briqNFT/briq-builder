<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<style scoped>
.theme-main-page {
    @apply bg-gray-100 text-black;
}


</style>

<template>
    <div class="theme-main-page">
        <Header/>
        <div class="container m-auto">
            <div class="flex flex-col justify-around items-center h-[30rem] bg-black text-white rounded-md my-4">
                <h1 class="text-center">{{ route.params.theme }}</h1>
                <p>Lorem Ipsum description here</p>
            </div>
            <div class="container m-auto max-w-4xl">
                <p class="text-center my-12 font-semibold text-lg">Sale starting soon</p>
                <div class="grid grid-cols-4 auction-countdown gap-12">
                    <div
                        v-for="i in [['Days', 2], ['Hours', 1], ['Minutes', 24], ['Seconds', 43]]" :key="i[0]">
                        <div class="flex justify-center gap-4">
                            <p class="text-max font-bold flex-1 basis-1 px-4 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[0] }}</p>
                            <p class="text-max font-bold flex-1 basis-1 px-4 bg-base border border-darker rounded text-center">{{ ('' + i[1]).padStart(2, '0')[1] }}</p>
                        </div>
                        <p class="text-center uppercase text-xl font-bold mt-4">{{ i[0] }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="container m-auto">
            <BoxListing/>
        </div>
        <Footer/>
    </div>
</template>