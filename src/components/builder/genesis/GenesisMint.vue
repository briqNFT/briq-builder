<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';

import FabricIcon from '@/assets/landing/fabric.png';
import FirstIcon from '@/assets/landing/frst.svg';
import StarkwareIcon from '@/assets/landing/starkware.svg';

import InlinedRocketCover from './InlinedRocketCover';
import RocketGlb from '@/assets/landing/rocket.glb?url';
import { nextTick } from 'vue';

import { h, ref, onBeforeMount, onBeforeUnmount, onMounted } from 'vue';

const modelViewerLoading = ref(true);
const modelViewerLoadingPromise = import('@google/model-viewer');
modelViewerLoadingPromise.then(() => modelViewerLoading.value = false);

const briqParallax = ref(0);

const onScroll = (_event: Event) => {
    briqParallax.value = window.scrollY / 6;
}

onBeforeMount(() => {
    //    document.body.style.backgroundColor = 'rgb(var(--color-base))';
    window.addEventListener('scroll', onScroll);
});
onBeforeUnmount(() => {
    //    document.body.style.backgroundColor = '';
    window.removeEventListener('scroll', onScroll);
});

const modelViewer = h('model-viewer', {
    alt: 'A set made of briqs',
    src: RocketGlb,
    poster: InlinedRocketCover,
});

onMounted(async () => {
    await modelViewerLoadingPromise;
    nextTick(() => {
        // Rotate the model when loaded because by default it points in the wrong direction.
        const modelViewer = document.querySelector('model-viewer')! as any;
        modelViewer.addEventListener('load', () => {
            modelViewer.orientation = '0deg 0deg 200deg';
            //modelViewer.scale = '0.5 0.5 0.5';
            modelViewer.dismissPoster();
        });
    });
});

</script>

<template>
    <!-- Make it absolute so h-screen works below -->
    <Header class="absolute left-0 right-0 z-50"/>
    <div class="bg-base">
        <div class="container m-auto relative h-screen p-[6rem] flex flex-col overflow-hidden">
            <div class="grow-[3]"/>
            <div class="z-50 flex flex-wrap justify-around items-center">
                <div class="relative p-20">
                    <div>
                        <h1 class="text-max font-bold leading-tighter my-8">Seize the <span class="briq-logo !m-0 !font-extrabold">briqs</span><br>of construction</h1>
                        <p class="text-lg font-normal">briq is a powerful Web3 toy which aims at<br>developping imagination and creativity</p>
                    </div>
                </div>
                <component
                    v-if="!modelViewerLoading"
                    :is="modelViewer" class="flex-1 min-w-[10rem] h-full w-full"
                    reveal="manual" loading="eager" shadow-intensity="0.5" shadow-softness="1" disable-zoom camera-controls auto-rotate="true"
                    field-of-view="40deg" camera-target="2m 23m 2m"
                    style="background-color: unset; --poster-color: transparent"/>
                <!-- Manually inlined rocket cover, around 20KB -->
                <div v-else class="flex-1 min-w-[10rem] flex justify-center"><img :src="InlinedRocketCover"></div>
            </div>
            <div class="grow-[6]"/>
        </div>
        <div class="container m-auto absolute top-0 left-0 right-0">
            <div class="relative w-full h-screen">
                <div class="pointer-events-none user-select-none absolute z-50 left-0" :style="{ top: `${150 - briqParallax}px` }">
                    <BriqsOverlayT/>
                </div>
                <div class="pointer-events-none user-select-none absolute z-50 left-0" :style="{ bottom: `${-120 + briqParallax}px` }">
                    <BriqsOverlayB class="w-[1432px] h-[780px] relative top-[150px] tall-md:top-[0px]"/>
                </div>
                <div class="pointer-events-none user-select-none absolute z-50 lg:right-[-600px] xl:right-[-250px] 2xl:right-[-100px]" :style="{ top: `${150 - briqParallax}px` }">
                    <BriqsOverlayR class="w-[1432px] h-[780px]"/>
                </div>
            </div>
        </div>
    </div>
    <div
        class="bg-[#007FC9] w-full overflow-hidden z-[-100]">
        <p class="h-[112px] flex items-center text-[72px] text-white w-max flex">
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
        </p>
    </div>
    <div>
        <div class="container m-auto p-20">
            <div class="grid grid-cols-3 gap-8 explanations">
                <div>
                    <div class="flex justify-center items-center h-[10rem] pb-4">
                        <div class="grid grid-cols-3 block-grid gap-2">
                            <p class="bg-accent"/><p class="bg-accent"/><p class="bg-base"/>
                            <p class="bg-accent"/><p class="bg-base"/><p class="bg-accent"/>
                        </div>
                    </div>
                    <h2>Compose</h2>
                    <p>briqs are construction blocks stored on the blockchain.</p>
                    <p>Technically, they’re ERC-1155 tokens stored on Starknet, an Ethereum layer two solution allowing cheap transaction costs.</p>
                    <p>Your briqs are yours, forever.</p>
                </div>
                <div>
                    <div class="flex justify-center items-center h-[10rem] pb-4">
                        <div class="grid grid-cols-2 block-grid gap-2">
                            <p class="bg-accent"/><p class="bg-accent"/>
                            <p class="bg-accent"/><p class="bg-accent"/>
                        </div>
                    </div>
                    <h2>Build</h2>
                    <p>briq can be assembled to create NFTs. These NFT are called sets.</p>
                    <p>Transfer, sell, lend, break your NFTs any way you want.</p>
                    <p>Disassemble your set to get your briqs back and build something new.</p>
                </div>
                <div>
                    <div class="flex justify-center items-center h-[10rem] pb-4">
                        <div class="grid grid-cols-3 block-grid gap-2">
                            <p class="bg-base"/><p class="bg-accent"/><p class="bg-base"/>
                            <p class="bg-accent"/><p class="bg-accent"/><p class="bg-accent"/>
                        </div>
                    </div>
                    <h2>Play</h2>
                    <p>briqs sets are highly interoperable NFTs. Carry them around with you to the nearest metaverse. </p>
                    <p>Integrate briq in any way you want. Seize the briqs of construction.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="container mx-auto mb-20 px-20">
        <routerLink :to="{ name: 'Theme', params: { theme: 'test' } }">
            <div class="bg-black text-white rounded-lg flex flex-col gap-20 py-20 items-center justify-between">
                <h1>Starknet City</h1>
                <p>Discover the briq genesis sale <i class="fa-solid fa-arrow-right"/></p>
            </div>
        </routerlink>
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
    @apply rounded bg-base p-8 border border-darker;
}
.explanations p {
    @apply my-4;
}
.block-grid p {
    @apply h-8 w-8 rounded-sm p-0 m-0;
}
</style>

<style>
/* Hide the progress bar, I'm styling manually */
model-viewer::part(default-progress-bar), model-viewer::part(default-progress-mask) {
    display: none;
}
</style>