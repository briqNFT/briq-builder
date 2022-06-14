<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const items = ref([1, 2, 3, 4, 5, 6, 7]);
</script>

<style scoped>
.theme-main-page .item-card > div {
    @apply h-[500px] flex flex-col relative top-0 transition-all;
}
.theme-main-page .item-card:hover > div {
    @apply top-[-1rem] shadow-xl;
}

.theme-main-page .item-card > div div {
    @apply shrink basis-[0px] min-h-0 overflow-hidden relative transition-all;
}

.theme-main-page .item-card div button {
    @apply absolute top-0 w-full;
}
.theme-main-page .item-card:hover div {
    @apply basis-[40px];
}
</style>

<template>
    <div class="container m-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-8">
        <routerLink
            :to="{ name: 'Box', 'params': { 'box': 'spaceman' } }"
            v-for="i in items" :data-key="i" :key="i">
            <div class="item-card relative">
                <div class="bg-white px-4 py-2 border-[1px] border-gray-200 rounded gap-1">
                    <p class="flex-1 min-h-0 min-w-0 flex justify-center items-center"><img class="min-h-0 min-w-0 max-h-[250px]" src="/spaceman/step_7.png"></p>
                    <h3 class="font-bold">Item {{ i }}</h3>
                    <p class="font-medium">Description of the item<br>Another line</p>
                    <hr>
                    <p class="flex justify-between"><span>Last Bid</span><span>0.4 eth</span></p>
                    <p class="flex justify-between"><span>Sales End</span><span>4 days left</span></p>
                    <div>
                        <Btn class="text-white w-full">Bid on this item</Btn>
                    </div>
                </div>
            </div>
        </routerlink>
    </div>
</template>