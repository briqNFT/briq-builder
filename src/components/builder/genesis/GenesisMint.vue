<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

import Composable from '@/assets/landing/composable.svg';
import Interoperable from '@/assets/landing/interoperable.svg';
import OnChain from '@/assets/landing/onchain.svg';

import BriqsOverlay from '@/assets/landing/briqs.svg';

import FabricIcon from '@/assets/landing/fabric.png';
import FirstIcon from '@/assets/landing/frst.svg';
import StarkwareIcon from '@/assets/landing/starkware.svg';


import { ref, onBeforeMount, onBeforeUnmount } from 'vue';

const briqOverlay = ref(null);

const onScroll = (_event: Event) => {
    briqOverlay.value.$el.style.bottom = `${-50 + window.scrollY / 6}px`;
}

onBeforeMount(() => {
    document.body.style.backgroundColor = 'rgb(var(--color-base))';
    window.addEventListener('scroll', onScroll);
});
onBeforeUnmount(() => {
    document.body.style.backgroundColor = '';
    window.removeEventListener('scroll', onScroll);
});

</script>

<template>
    <!-- Make it absolute so h-screen works below -->
    <Header class="absolute left-0 right-0 z-50"/>
    <div class="container m-auto relative h-screen flex flex-col">
        <div class="grow-[3]"/>
        <h1 class="text-max font-bold leading-tighter my-8">Seize the <span class="briq-logo !m-0 !font-extrabold">briqs</span><br>of construction</h1>
        <p class="text-lg font-normal">briq is a powerful Web3 toy which aims at<br>developping imagination and creativity</p>
        <div class="grow-[4]"/>
        <BriqsOverlay class="pointer-events-none user-select-none absolute bottom-[-50px] z-50 left-0" ref="briqOverlay"/>
    </div>
    <div class="bg-[#22A094] w-full overflow-hidden">
        <p class="h-[112px] flex items-center text-[72px] text-white w-max flex">
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
        </p>
    </div>
    <div class="bg-[#FEF6F3]">
        <div class="container m-auto p-20">
            <div class="grid grid-cols-3 gap-8 explanations">
                <div>
                    <p class="flex justify-center items-center h-[12rem] pb-4"><Composable/></p>
                    <h2>Composable</h2>
                    <p>Association of briqs are NFTs called sets.</p>
                    <p>Sets can be disassembled to get the briqs back and create something new.</p>
                    <p>They can be combined to create even more complex structures.</p>
                </div>
                <div>
                    <p class="flex justify-center items-center h-[12rem] pb-4"><Interoperable/></p>
                    <h2>Interoperable</h2>
                    <p>briqs and sets can be used in any game and can be interpreted as you see fit.</p>
                    <p>Build a car and race. Tear it apart and build a plane.</p>
                    <p>They can be combined to create even more complex structures.</p>
                </div>
                <div>
                    <p class="flex justify-center items-center h-[12rem] pb-4"><OnChain/></p>
                    <h2>On-chain</h2>
                    <p>Association of briqs are NFTs called sets.</p>
                    <p>Sets can be disassembled to get the briqs back and create something new.</p>
                    <p>They can be combined to create even more complex structures.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="bg-black text-white">
        <div class="container m-auto flex flex-col gap-20 py-20 items-center justify-between">
            <h1>Starknet City</h1>
            <routerLink :to="{ name: 'Theme', params: { theme: 'test' } }">
                <p>Discover the briq genesis sale <i class="fa-solid fa-arrow-right"/></p>
            </routerlink>
        </div>
    </div>
    <div class="bg-[#FEF6F3]">
        <div class="container m-auto p-20">
            <p class="text-xl my-8">Trusted by</p>
            <div class="grid grid-cols-3 gap-4">
                <div
                    v-for="icon of [[FabricIcon, '#000000'], [FirstIcon, '#15132A'], [StarkwareIcon, '#28286E']]" :key="icon[0]"
                    class="h-[10rem] w-full rounded flex justify-center items-center px-8 py-4" :style="{ backgroundColor: icon[1] }">
                    <p v-if="typeof icon[0] === 'string'" class="flex-initial flex max-h-full py-8"><img class="object-contain shrink min-h-0 min-w-0" :src="icon[0]"></p>
                    <component v-else :is="icon[0]" fill="#fafafa" class="shrink w-full h-full min-h-0 min-w-0"/>
                </div>
            </div>
        </div>
    </div>
    <Footer/>
</template>

<style scoped>
h2 {
    @apply text-xl font-semibold my-2;
}
.explanations > div {
    @apply rounded bg-base p-8;
}
.explanations p {
    @apply my-4;
}
</style>
