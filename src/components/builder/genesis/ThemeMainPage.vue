<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';

const router = useRouter();
const route = useRoute();

const items = ref([1, 2, 3, 4, 5, 6, 7]);
</script>

<style scoped>
.theme-main-page {
    @apply bg-white text-black;
}

</style>

<template>
    <div class="theme-main-page">
        <div class="bg-base"><Header/></div>
        <div class=" bg-black text-white">
            <div class="container m-auto flex flex-col justify-around items-center h-[40rem]">
                <h1 class="text-center">{{ route.params.theme }}</h1>
                <p>Lorem Ipsum description here</p>
            </div>
        </div>
        <div>
            <div class="container m-auto grid grid-cols-4 gap-4 my-8">
                <div v-for="i in items" :data-key="i" :key="i" class="px-4 py-2 border-2 border-gray-200 rounded-md item-card">
                    <div class="flex flex-col">
                        <h3>Item {{ i }}</h3>
                        <p>Description of the item<br>Another line</p>
                        <p class="flex-1 shrink-2 inline-flex justify-center"><img class="h-auto" src="/spaceman/step_7.png"></p>
                        <a @click.stop.prevent="router.push({ name: 'Box', 'params': { 'box': 'spaceman' } })" :href="router.resolve({ name: 'Box', 'params': { 'box': 'spaceman' } }).path"><Btn class="text-white">Bid on this item</Btn></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>