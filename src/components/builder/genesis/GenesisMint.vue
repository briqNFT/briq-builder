<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';

import FabricIcon from '@/assets/landing/fabric.png';
import FirstIcon from '@/assets/landing/frst.svg';
import StarkwareIcon from '@/assets/landing/starkware.svg';

import CollectImage from '@/assets/landing/landing_box_cover.png';
import PlayImage from '@/assets/landing/landing_full_speeder.png';
import BuildImage from '@/assets/landing/landing_speeder_eclate.png';

import StarknetCity from '@/assets/landing/starknet_city_upcoming.jpg';

import InlinedRocketCover from './InlinedRocketCover';
import RocketGlb from '@/assets/landing/rocket.glb?url';
import { nextTick } from 'vue';

import { h, ref, onBeforeMount, onBeforeUnmount, onMounted } from 'vue';

import { useThemeURLs } from './ThemeUrlComposable';

const modelViewerLoading = ref(true);
const modelViewerLoadingPromise = import('@google/model-viewer');
modelViewerLoadingPromise.then(() => modelViewerLoading.value = false);

const briqParallax = ref(0);

const onScroll = (_event: Event) => {
    briqParallax.value = window.scrollY / 6;
}

onBeforeMount(() => {
    //document.body.style.backgroundColor = '#ffffff';
    window.addEventListener('scroll', onScroll);
});
onBeforeUnmount(() => {
    //document.body.style.backgroundColor = '';
    window.removeEventListener('scroll', onScroll);
});


const {
    themeLogoSrcSet,
} = useThemeURLs();

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

<style scoped>

h1 {
    @apply font-medium;
}
h3 {
    @apply mt-6 mb-4 text-2xl;
}
h4 {
    @apply mb-4 text-md text-primary font-medium;
}
.explanations p {
    @apply leading-tight mb-2;
}
.block-grid p {
    @apply text-base box-content h-6 w-6 border-2 border-grad-lightest shadow-sm rounded-sm p-0 m-0;
}

.genesis-tab > img {
    @apply transition-all duration-300;
}

.genesis-tab:hover > img {
    @apply scale-105;
}
</style>

<template>
    <!-- Make it absolute so h-screen works below -->
    <Header class="absolute left-0 right-0 z-50"/>
    <div>
        <div class="container m-auto relative h-screen lg:p-[6rem] flex flex-col overflow-hidden">
            <div class="grow-[3]"/>
            <div class="flex flex-wrap justify-around items-center">
                <div class="relative md:p-10 lg:p-20">
                    <div>
                        <h1 class="text-[3rem] md:text-[4.5rem] font-bold leading-[5rem] my-6">Seize the <span class="briq-logo !m-0 !font-extrabold">briqs</span><br>of creation</h1>
                        <p class="text-lg font-normal">briq is a powerful Web3 toy which aims at<br>developping imagination and creativity</p>
                    </div>
                </div>
                <component
                    v-if="!modelViewerLoading"
                    :is="modelViewer" class="flex-1 min-w-[10rem] h-full w-full z-0"
                    reveal="manual" loading="eager" shadow-intensity="0.5" shadow-softness="1" disable-zoom camera-controls auto-rotate="true"
                    field-of-view="40deg" camera-target="2m 23m 2m"
                    style="background-color: unset; --poster-color: transparent"/>
                <!-- Manually inlined rocket cover, around 20KB -->
                <div v-else class="flex-1 min-w-[10rem] flex justify-center"><img :src="InlinedRocketCover"></div>
            </div>
            <div class="grow-[6]"/>
        </div>
        <div class="pointer-events-none user-select-none container m-auto absolute top-0 left-0 right-0 overflow-hidden">
            <div class="relative w-full h-screen">
                <div class="absolute z-10 left-0" :style="{ top: `${150 - briqParallax}px` }">
                    <BriqsOverlayT/>
                </div>
                <div class="absolute z-10 left-0" :style="{ bottom: `${-120 + briqParallax}px` }">
                    <BriqsOverlayB class="w-[1432px] h-[780px] relative top-[150px] tall-md:top-[0px]"/>
                </div>
                <div class="absolute z-10 lg:right-[-600px] xl:right-[-250px] 2xl:right-[-100px]" :style="{ top: `${150 - briqParallax}px` }">
                    <BriqsOverlayR class="w-[1432px] h-[780px]"/>
                </div>
            </div>
        </div>
    </div>
    <div
        class="bg-[#F6C844] w-full overflow-hidden z-[-100] border-t-2 border-b-2 border-black">
        <p class="py-2 flex items-center text-black text-2xl font-semibold w-max h-[70px]">
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
            <span class="w-max animate-text-loop whitespace-pre">briq is NFT matter • </span>
        </p>
    </div>
    <div class="bg-grad-lightest">
        <div class="container m-auto py-6 md:px-8 lg:px-[4rem] xl:px-[10rem] explanations">
            <div class="flex flex-row flex-wrap-reverse items-center gap-[0rem] my-0">
                <div class="flex-1 md:px-[2rem] xl: px-[8rem] mb-10">
                    <h3>Collect</h3>
                    <p>briqs are construction blocks stored on the blockchain.</p>
                    <p>Technically, they’re ERC-1155 tokens stored on Starknet, an Ethereum layer two solution allowing cheap transaction costs.</p>
                    <p>Your briqs are yours, forever.</p>
                    <p class="my-4"><RouterLink to="/themes" class="text-primary">Check out our official sets <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>
                </div>
                <div class="flex-1 min-w-[300px]">
                    <img :src="CollectImage" class="max-w-none max-h-none w-full h-auto">
                </div>
            </div>
            <div class="flex flex-row flex-wrap items-center gap-[4rem] mb-16">
                <div class="flex-1 min-w-[300px]">
                    <img :src="BuildImage" class="drop-shadow-sm max-w-none max-h-none w-full h-auto">
                </div>
                <div class="flex-1 md:px-[2rem] xl: px-[8rem]">
                    <h3>Build</h3>
                    <p>briq can be assembled to create NFTs. These NFT are called sets.</p>
                    <p>Transfer, sell, lend, break your NFTs any way you want.</p>
                    <p>Disassemble your set to get your briqs back and build something new.</p>
                    <p class="my-4"><RouterLink to="/builder" class="text-primary">Start Building <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>
                </div>
            </div>
            <div class="flex flex-row flex-wrap-reverse items-center gap-[4rem] my-16">
                <div class="flex-1 md:px-[2rem] xl: px-[8rem]">
                    <h3>Play</h3>
                    <p>briqs sets are highly interoperable NFTs. Carry them around with you to the nearest metaverse. </p>
                    <p>Integrate briq in any way you want. Seize the briqs of creation.</p>
                    <p class="my-4"><RouterLink to="/builder" class="text-primary">Discover our Altzone integration <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>
                </div>
                <div class="flex-1 min-w-[300px]">
                    <img :src="PlayImage" class="drop-shadow-2xl max-w-none max-h-none w-full h-auto">
                </div>
            </div>
        </div>
    </div>
    <div class="container mx-auto mb-4 md:mb-20 px-4 md:px-20">
        <div class="text-center mt-20 mb-10">
            <h1>Discover our Genesis Sale</h1>
        </div>
        <routerLink :to="{ name: 'Theme', params: { theme: 'starknet_city' } }">
            <div class="h-[400px] bg-black text-white rounded-lg relative overflow-hidden genesis-tab">
                <img :src="StarknetCity" class="absolute max-w-none w-auto h-full top-[50%] translate-y-[-50%] translate-x-[-50%] left-[50%]">
                <div class="z-1 p-8 relative h-full flex flex-col justify-between items-center xl:items-start w-full">
                    <img :srcset="themeLogoSrcSet('starknet_city')" class="w-auto h-auto m-8">
                    <p>Discover the new theme <i class="fa-solid fa-arrow-right relative top-[1px]"/></p>
                </div>
            </div>
        </routerlink>
    </div>
    <div class="bg-grad-darkest py-20">
        <h1 class="text-center text-grad-lightest">A prolific community of builders</h1>
        <div class="flex justify-center gap-6 mt-14">
            <a href=""><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all">TODO Aspect</Btn></a>
            <a href=""><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all">TODO Mintsquare</Btn></a>
            <a href=""><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all">TODO Discord</Btn></a>
        </div>
    </div>
    <div class="bg-info-warning w-full border-t-2 border-b-2 border-black">
        <div class="container m-auto px-4 md:px-20 my-4 md:my-20">
            <p class="text-max font-medium text-center my-10">Trusted by</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    v-for="icon of [[FabricIcon, '#000000'], [FirstIcon, '#15132A'], [StarkwareIcon, '#28286E']]" :key="icon[0]"
                    class="h-[10rem] w-full rounded-md flex justify-center items-center px-12 py-6" :style="{ backgroundColor: icon[1] }">
                    <p v-if="typeof icon[0] === 'string'" class="flex-initial flex max-h-full py-4"><img class="object-contain shrink min-h-0 min-w-0" :src="icon[0]"></p>
                    <component v-else :is="icon[0]" fill="#fafafa" width="360px" class="shrink w-full h-full min-h-0 min-w-0"/>
                </div>
            </div>
        </div>
    </div>
    <Footer/>
</template>

<style>
/* Hide the progress bar, I'm styling manually */
model-viewer::part(default-progress-bar), model-viewer::part(default-progress-mask) {
    display: none;
}
</style>