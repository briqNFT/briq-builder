<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

const router = useRouter();
const route = useRoute();

const items = ref([1, 2, 3, 4, 5, 6, 7]);
</script>

<style scoped>
.theme-main-page {
    @apply bg-white text-black;
}

.theme-main-page .item-card > div {
    @apply h-[500px] flex flex-col relative top-0 transition-all;
}
.theme-main-page .item-card:hover > div {
    @apply top-[-1rem] shadow-xl;
}

.theme-main-page .item-card > div div {
    @apply shrink basis-[0px] min-h-0 overflow-hidden relative transition-all;
}

.theme-main-page .item-card div a {
    @apply absolute top-0 w-full;
}
.theme-main-page .item-card:hover div {
    @apply basis-[40px];
}

</style>

<template>
    <div class="theme-main-page">
        <div class="bg-base"><Header/></div>
        <div class="">
            <div class="container m-auto flex flex-col justify-around items-center h-[40rem] bg-black text-white rounded-xl my-4">
                <h1 class="text-center">{{ route.params.theme }}</h1>
                <p>Lorem Ipsum description here</p>
                <p>Auction coming soon</p>
                <p>Auction date here</p>
            </div>
        </div>
        <div>
            <div class="container m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-8">
                <div v-for="i in items" :data-key="i" :key="i" class="item-card relative">
                    <div class="px-4 py-2 border-[1px] border-gray-200 rounded-md gap-1">
                        <p class="flex-1 min-h-0 min-w-0 flex justify-center items-center"><img class="min-h-0 min-w-0 max-h-[250px]" src="/spaceman/step_7.png"></p>
                        <h3 class="font-bold">Item {{ i }}</h3>
                        <p class="font-medium">Description of the item<br>Another line</p>
                        <hr>
                        <p class="flex justify-between"><span>Last Bid</span><span>0.4 eth</span></p>
                        <p class="flex justify-between"><span>Sales End</span><span>4 days left</span></p>
                        <div>
                            <a
                                @click.stop.prevent="router.push({ name: 'Box', 'params': { 'box': 'spaceman' } })"
                                :href="router.resolve({ name: 'Box', 'params': { 'box': 'spaceman' } }).path">
                                <Btn class="text-white w-full">Bid on this item</Btn>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <Footer/>
        </div>
    </div>
</template>