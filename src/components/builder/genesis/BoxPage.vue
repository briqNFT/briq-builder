<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';

const router = useRouter();

</script>

<style scoped>
.theme-box-page {
    @apply bg-gray-100 text-black;
}

div.box-page-block {
    @apply border-[1px] bg-white p-4 border-gray-200 rounded-md;
}
h4 {
    @apply font-medium;
}
</style>

<template>
    <div class="relative theme-box-page">
        <div class="bg-base"><Header/></div>
        <div>
            <div class="container m-auto my-8">
                <p>
                    <routerLink
                        :to="{ name: 'Theme', 'params': { 'theme': 'test' } }"
                        class="text-base">
                        starknet city
                    </routerLink> > Spaceman
                </p>
                <div class="grid grid-cols-[8fr_4fr] gap-4">
                    <div class="grid-span flex justify-center items-center min-h-[20rem]">
                        <img src="/spaceman/step_7.png">
                    </div>
                    <div class="flex flex-col">
                        <h3>Starknet City</h3>
                        <h1 class="text-4xl">Spaceman</h1>
                        <div class="box-page-block flex-1 flex flex-col justify-between">
                            <div>
                                <h4>Sale ends on</h4>
                                <p>July 1, 2022 at 11:32 AM GMT+1</p>
                                <div>AUCTION TIME BLOCK HERE</div>
                            </div>
                            <div>
                                <h4 class="text-xl">Winning Bid</h4>
                                <p>1.35 ETH</p>
                                <Btn class="w-full text-white">Place a bid</Btn>
                            </div>
                        </div>
                    </div>
                    <div class="box-page-block">
                        <h4>Description</h4>
                        <p class="my-4">
                            Association of briqs are named sets.<br><br>
                            Sets can be disassembled to get the briqs back and create something new.<br><br>
                            They can be combined to create even more complex structures.
                        </p>
                        <p class="font-medium mt-12">WARNING: NO CHOKING HAZARD. Suitable for all humans and cyborgs.</p>
                    </div>
                    <div class="box-page-block">
                        <h4>Previous bids</h4>
                        <div class="flex flex-col gap-2 pt-2">
                            <div v-for="i in new Array(5)" class="flex justify-between">
                                <p>0xcafe0123babe</p>
                                <p>1.35 eth <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 class="my-8">Other sets from this theme</h2>
                    <BoxListing/>
                </div>
            </div>
        </div>
        <div>
            <Footer/>
        </div>
    </div>
</template>