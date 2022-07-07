<script setup lang="ts">
import Header from '../landing_page/Header.vue';
import Footer from '../landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';

import ProfileIcon from '@/assets/profile/profile.svg';

import { maybeStore } from '@/chain/WalletLoading';

const sections = ['All items', 'Sealed boxes', 'Booklets', 'Genesis Sets', 'Personal creations'];

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
    <div class="bg-[#FFD215] relative w-full h-[9rem] tall-lg:h-[12rem] overflow-hidden">
        <div class="container m-auto relative">
            <div class="absolute left-[-100px] bottom-[-250px]"><BriqsOverlayB/></div>
            <div class="absolute top-0 left-[800px]"><BriqsOverlayT/></div>
            <div class="absolute top-0 right-[-100px]"><BriqsOverlayR/></div>
        </div>
    </div>
    <div class="bg-white p-8 pb-0 flex flex-col items-center border-b border-darker">
        <div class="relative bottom-[6rem] right-[4rem] pb-[4rem]">
            <div class="absolute h-[8rem] w-[8rem] bg-body border-4 border-base rounded-md shadow-md flex justify-center items-center">
                <ProfileIcon width="100%" height="100%"/>
            </div>
        </div>
        <div/>
        <h2>{{ maybeStore?.userWalletAddress || 'No wallet selected' }}</h2>
        <p class="my-4"><span class="font-medium">Available briqs:</span> 800/1200</p>
        <div class="flex gap-12 mt-8">
            <p class="pb-4 border-b-4 border-accent">Inventory</p>
            <p>Shopping Activity</p>
        </div>
    </div>
    <div class="container m-auto my-8 grid grid-cols-[3fr_9fr]">
        <div>
            <h2>Inventory</h2>
            <div class="mt-4 flex flex-col gap-2">
                <Btn no-background class="text-left" v-for="section of sections">{{ section }}</Btn>
            </div>
        </div>
        <div>
            <div>
                <h3>Sealed boxes</h3>
                <div class="bg-base rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any boxes.</p>
                    <p>Browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
            <div>
                <h3>Booklets</h3>
                <div class="bg-base rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any booklets.</p>
                    <p>Open one of your boxes or browse the available items in our Genesis collections!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
            <div>
                <h3>Genesis Sets</h3>
                <div class="bg-base rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have any official Genesis sets.</p>
                    <p>Start working on your booklets or browse the available items in our Genesis collections!</p>
                    <div class="mt-2 flex gap-2">
                        <Btn secondary>Browse the themes</Btn>
                        <RouterLink :to="{ name: 'Builder' }"><Btn>Go to Builder</Btn></RouterLink>
                    </div>
                </div>
            </div>
            <div>
                <h3>Personal creations</h3>
                <div class="bg-base rounded-md my-4 p-8 flex flex-col justify-center items-center gap-2">
                    <p class="font-semibold">You don't have personal creations.</p>
                    <p>Get some briqs and start building!</p>
                    <Btn secondary class="mt-2">Browse the themes</Btn>
                </div>
            </div>
        </div>
    </div>
    <Footer/>
</template>
