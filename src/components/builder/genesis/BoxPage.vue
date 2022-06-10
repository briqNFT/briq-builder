<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';

const route = useRoute();

</script>

<style scoped>
.theme-box-page {
    @apply bg-white text-black;
}

div.box-page-block {
    @apply border-4 border-gray-200 rounded-xl;
}
</style>

<template>
    <div class="absolute h-screen w-screen bg-white"/>
    <div class="relative theme-box-page">
        <div class="bg-base"><Header/></div>
        <div>
            <div class="container m-auto grid grid-cols-4 gap-4 my-8">
                <div class="box-page-block flex flex-col items-center justify-around">
                    <h2>Spaceman</h2>
                    <img src="/spaceman/step_7.png">
                </div>
                <div class="box-page-block">
                    <p>More information in this block</p>
                </div>
                <div class="box-page-block">
                    <p>Bidding information block</p>
                </div>
            </div>
        </div>
    </div>
</template>