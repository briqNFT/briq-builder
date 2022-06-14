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
        <div class="bg-base"><Header/></div>
        <div class="">
            <div class="container m-auto flex flex-col justify-around items-center h-[40rem] bg-black text-white rounded-md my-4">
                <h1 class="text-center">{{ route.params.theme }}</h1>
                <p>Lorem Ipsum description here</p>
                <p>Auction coming soon</p>
                <p>Auction date here</p>
            </div>
        </div>
        <div>
            <BoxListing/>
        </div>
        <div>
            <Footer/>
        </div>
    </div>
</template>