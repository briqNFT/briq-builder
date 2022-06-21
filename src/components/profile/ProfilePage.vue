<script setup lang="ts">
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';
import BoxListing from '../builder/genesis/BoxListing.vue';
</script>

<style scoped>
.imagePlaceholder {
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        10px,
        rgba(247, 137, 74, 0.5) 10px,
        rgba(247, 137, 74, 0.5) 15px
    );
}

</style>

<template>
    <Header/>
    <div class="container m-auto">
        <div class="rounded-lg bg-white p-8 pb-0 flex flex-col items-center gap-8">
            <div class="bg-body rounded-md relative w-full h-[14rem] overflow-hidden">
                <div class="absolute bottom-[-50px]"><BriqsOverlayB/></div>
                <div class="absolute top-0 left-[900px]"><BriqsOverlayT/></div>
                <div class="absolute top-0 right-0"><BriqsOverlayR/></div>
            </div>
            <div class="relative bottom-[6rem] right-[4rem]">
                <div class="absolute h-[8rem] w-[8rem] bg-base rounded-md shadow-md flex justify-center items-center">
                    CARRE
                </div>
            </div>
            <div/>
            <h2>ADDRESS</h2>
            <p>Available briqs: 800/1200</p>
            <div class="flex gap-12">
                <p class="pb-4 border-b-4 border-accent">Boxes</p>
                <p>Booklets</p>
                <p>Creations</p>
            </div>
        </div>
    </div>
    <div class="container m-auto my-8">
        <h2>Sets</h2>
        <BoxListing/>
    </div>
    <Footer/>
</template>