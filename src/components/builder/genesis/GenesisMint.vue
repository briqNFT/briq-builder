<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

import BriqsOverlayB from '@/assets/landing/briqs-bottom.svg';
import BriqsOverlayT from '@/assets/landing/briqs-top.svg';
import BriqsOverlayR from '@/assets/landing/briqs-right.svg';

import FabricIcon from '@/assets/landing/fabric.png';
import FirstIcon from '@/assets/landing/frst.svg';
import StarkwareIcon from '@/assets/landing/starkware.svg';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';

import CollectImage from '@/assets/landing/landing_box_cover.jpg';
import PlayImage from '@/assets/landing/landing_full_speeder.jpg';
import BuildImage from '@/assets/landing/landing_speeder_eclate.jpg';


//import InlinedRocketCover from '@/assets/landing/rocket.jpg';
import InlinedRocketCover from './InlinedRocketCover';
import RocketGlb from '@/assets/landing/rocket.glb?url';

import { nextTick, h, ref, onBeforeMount, onBeforeUnmount, onMounted } from 'vue';

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
    themeCoverUrl,
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
            setTimeout(() => modelViewer.dismissPoster(), 0);
        });
        /*
        modelViewer.addEventListener('poster-dismissed', async () => {
            const blob = await modelViewer.toBlob({ idealAspect: true });
            const url = URL.createObjectURL(blob);
            doDownload(url, 'image');
            URL.revokeObjectURL(url);
        })
        */
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

@media (max-width: 767px) {
    .briqoverlay {
        @apply !invisible;
    }
}
</style>

<template>
    <!-- Make it absolute so h-screen works below -->
    <Header class="absolute left-0 right-0 z-50"/>
    <div>
        <div class="container m-auto relative h-screen xl:p-[6rem] flex flex-col overflow-hidden">
            <div class="grow-[3]"/>
            <div class="grow-[5] md:grow-[3] flex flex-wrap justify-around items-center">
                <div class="relative p-4 md:p-10 lg:p-20 xl:mb-20 flex-initial self-start h-min">
                    <div>
                        <h1 class="text-[3rem] sm:text-[4.5rem] font-bold leading-[5rem] my-6">Seize the <span class="briq-logo !m-0 !font-extrabold">briqs</span><br>of creation</h1>
                        <p class="text-lg font-normal">Collect, build and play with briqs,<br>the building blocks of the metaverse.</p>
                    </div>
                </div>
                <div class="max-w-[24rem] lg:max-w-[1000rem] min-w-[14rem] self-stretch flex-1 w-full flex flex-col items-center justify-center relative">
                    <component
                        v-if="!modelViewerLoading"
                        :is="modelViewer" class="w-full h-full absolute"
                        reveal="manual" loading="eager" shadow-intensity="0.5" shadow-softness="1" disable-zoom disable-pan camera-controls auto-rotate="true"
                        environment-image="legacy"
                        min-camera-orbit="-Infinity 22.5deg 150m" camera-orbit="0deg 75deg 160m" max-camera-orbit="Infinity 157.5deg 160m"
                        field-of-view="40deg" camera-target="2m 23m 2m"/>
                    <!-- Manually inlined rocket cover, around 20KB -->
                    <div :class="`w-full ${modelViewerLoading ? 'visible' : 'invisible'}`"><img class="max-w-none w-full" :src="InlinedRocketCover"></div>
                </div>
            </div>
            <div class="grow-[6]"/>
        </div>
        <div class="pointer-events-none select-none container m-auto absolute top-0 left-0 right-0 w-screen overflow-hidden briqoverlay invisible lg:visible tall-md:visible">
            <div class="relative w-full h-screen">
                <div class="absolute z-10 left-0 hidden sm:block" :style="{ top: `${150 - briqParallax}px` }">
                    <BriqsOverlayT/>
                </div>
                <div class="absolute z-10 left-0 block sm:hidden" :style="{ top: `${80 - briqParallax}px` }">
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
                <div class="flex-1 md:px-[2rem] xl:px-[8rem] mb-10">
                    <h3>Collect</h3>
                    <p>briqs are construction blocks stored on the blockchain. You can use them to build anything you want.</p>
                    <p>Technically, they’re ERC-1155 tokens stored on Starknet, an Ethereum layer two solution allowing cheap transaction costs.</p>
                    <p>Your briqs are yours, forever.</p>
                    <p class="my-4"><RouterLink to="/themes" class="text-primary">Check out our briq boxes <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>
                </div>
                <div class="flex-1 min-w-[300px]">
                    <img :src="CollectImage" class="max-w-none max-h-none w-full h-auto">
                </div>
            </div>
            <div class="flex flex-row flex-wrap items-center gap-[4rem] mb-16">
                <div class="flex-1 min-w-[300px]">
                    <!-- No drop shadow for the production JPGs -->
                    <img :src="BuildImage" class="max-w-none max-h-none w-full h-auto">
                </div>
                <div class="flex-1 md:px-[2rem] xl:px-[8rem]">
                    <h3>Build</h3>
                    <p>Assemble your briqs to create NFTs. These NFT are called sets..</p>
                    <p>Transfer, sell, lend, break your NFTs any way you want.</p>
                    <p>Disassemble your set to get your briqs back and build something new.</p>
                    <p class="my-4"><RouterLink to="/builder" class="text-primary">Start building <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>
                </div>
            </div>
            <div class="flex flex-row flex-wrap-reverse items-center gap-[4rem] my-16">
                <div class="flex-1 md:px-[2rem] xl:px-[8rem]">
                    <h3>Play</h3>
                    <p>Sets are highly interoperable NFTs. Carry them around with you to the nearest metaverse. </p>
                    <p>Build a spaceship and fly around with it. Disassemble it to build a house.</p>
                    <p>Integrate briq in any way you want. Seize the briqs of creation.</p>
                    <!--<p class="my-4"><RouterLink to="/builder" class="text-primary">Discover our Altzone integration <i class="fa-solid fa-arrow-right relative top-[1px]"/></RouterLink></p>-->
                </div>
                <div class="flex-1 min-w-[300px]">
                    <!-- No drop shadow for the production JPGs -->
                    <img :src="PlayImage" class="max-w-none max-h-none w-full h-auto">
                </div>
            </div>
        </div>
    </div>
    <div class="container mx-auto mb-4 md:mb-20 px-4 md:px-20">
        <div class="text-center mt-20 mb-10">
            <h1>Discover our latest sale</h1>
        </div>
        <routerLink :to="{ name: 'Theme', params: { theme: 'ducks_everywhere' } }">
            <div class="h-[500px] bg-black text-white rounded-lg relative overflow-hidden genesis-tab">
                <img :src="themeCoverUrl('ducks_everywhere', 'high')" class="absolute max-w-none w-auto h-full top-[50%] translate-y-[-50%] translate-x-[-50%] left-[50%]">
                <div class="z-1 p-8 relative h-full flex flex-col justify-between items-center xl:items-start w-full">
                    <img :srcset="themeLogoSrcSet('ducks_everywhere')" class="w-auto h-auto m-8">
                    <p class="text-right w-full"><i class="fa-solid fa-arrow-right relative top-[1px]"/> Discover the new theme</p>
                </div>
            </div>
        </routerlink>
    </div>
    <div class="bg-grad-darkest py-20 px-1">
        <h1 class="text-center text-grad-lightest">A prolific community of builders</h1>
        <div class="flex flex-wrap justify-center gap-6 mt-14">
            <a href="https://aspect.co/project/briq" rel="noopener" target="_blank"><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><img class="w-6 mr-3" :src="AspectLogo"> Aspect</Btn></a>
            <a href="https://mintsquare.io/starknet/briq/created" rel="noopener" target="_blank"><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><MintsquareLogo class="mr-3" height="1.5rem" width="1.5rem"/> Mintsquare</Btn></a>
            <a href="https://discord.gg/kpvbDCw5pr" rel="noopener" target="_blank"><Btn secondary class="relative hover:-translate-y-1 translate-y-0 transition-all text-md h-16 px-12"><i class="fab fa-discord text-xl mr-3"/> Discord</Btn></a>
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
model-viewer::part(default-progress-bar) {
    display: none;
}
</style>