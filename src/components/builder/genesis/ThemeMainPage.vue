<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BoxListing from './BoxListing.vue';
import { useRoute } from 'vue-router';
import { useGenesisStore } from '@/builder/GenesisStore';

import ThemeSeparatorImg from '@/assets/landing/theme_separator.png';

import ToggleParagraph from '@/components/generic/ToggleParagraph.vue';

import { useThemeURLs } from './ThemeUrlComposable';
import BoxCard from './BoxCard.vue';

const route = useRoute();

const themeName = computed(() => route.params.theme as string);

const genesisStore = useGenesisStore();

const themeData = computed(() => genesisStore.themedata[themeName.value]?._data );
const themeBoxes = computed(() => genesisStore.boxes[themeName.value]);

watchEffect(() => themeBoxes.value?._data?.map((x: string) => genesisStore.saledata[x]._data ));

const themeStatus = computed(() => {
    if (themeBoxes.value?._status !== 'LOADED')
        return themeBoxes.value?._status;
    return themeBoxes.value?._data?.some((x: string) => genesisStore.saledata[x]._status === 'LOADED') ? 'LOADED' : 'FETCHING';
});

const status = computed(() => themeBoxes.value._status);

const {
    themeCoverUrl,
    themeLogoSrcSet,
} = useThemeURLs();

// Wait until we've loaded sale data to show boxes.
const auctionBoxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.total_quantity === 1
}));

const dutchBoxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.total_quantity > 1
}));

const wave1Boxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.wave === '1';
}));

const wave2Boxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.wave === '2';
}));

const wave3Boxes = computed(() => themeBoxes.value?._data?.filter((x: string) => {
    return genesisStore.saledata?.[x]?._data?.wave === '3';
}));


const now = ref(Date.now() / 1000);
setInterval(() => now.value = Date.now() / 1000, 1000);
const saleStartsInSeconds = computed(() => themeData.value?.sale_start - now.value || 0);
const saleStartsIn = computed(() => {
    let tl = saleStartsInSeconds.value;
    const days = Math.floor(tl / 24 / 3600);
    tl -= days * 24 * 3600;
    const hours = Math.floor(tl / 3600);
    tl -= hours * 3600;
    const minutes = Math.floor(tl / 60);
    tl -= minutes * 60;
    const seconds = Math.floor(tl);
    return [['Days', days], ['Hours', hours], ['Minutes', minutes], ['Seconds', seconds]];
});

const hasDate = computed(() => !!themeData.value?.sale_start);
const isLive = computed(() => hasDate.value && saleStartsInSeconds.value <= 0 );

const coverUrl = computed(() => {
    return (quality: 'high' | 'low') => {
        let base = themeCoverUrl(themeName.value, quality);
        if (saleStartsInSeconds.value < 0)
            base += '?ready_sale';
        return base;
    }
})


watch([saleStartsInSeconds], (nv: number, ov: number) => {
    if (ov > 0 && nv <= 0)
        setTimeout(() => genesisStore.refreshBoxes(), 1000)

})
</script>

<style scoped>
.theme-bg::after {
    content: "";
    @apply absolute top-0 left-[50%] translate-x-[-50%] w-full h-full;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 90%, rgba(0, 0, 0, 1) 100%),
        linear-gradient(-90deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.3) 80%);
}

.faq p {
    @apply mb-4 text-justify text-sm text-[#aaaaaa] leading-snug;
}
.faq p a {
    @apply text-primary;
}

</style>

<template>
    <div class="">
        <Header/>
        <div>
            <div class="bg-black text-white">
                <div class="h-[585px] relative">
                    <div class="absolute w-full h-full theme-bg overflow-hidden">
                        <img :src="coverUrl('low')" alt="logo" class="invisible absolute h-full 2xl:h-auto 2xl:w-full max-w-none max-h-none top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
                        <div class="h-full w-full bg-cover bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${coverUrl('high')}), url(${coverUrl('low')})` }"/>
                    </div>
                    <div class="min-h-[500px] container py-[3.375rem] m-auto px-2 md:px-8 lg:px-[3.375rem] relative z-1">
                        <!--<h1 class="text-left font-black uppercase my-16">{{ themeData.name || route.params.theme }}</h1>-->
                        <h1><img class="min-h-[7rem]" :srcset="themeLogoSrcSet(themeName)" :alt="themeData?.name || (route.params.theme as string)"></h1>
                        <div class="mt-12 mb-8">
                            <h3 class="mb-3">{{ themeData?.tagline ?? "Loading theme name " }}</h3>
                            <p class="whitespace-pre-line">{{ themeData?.description ?? 'Loading description' }}</p>
                        </div>
                        <template v-if="!isLive && hasDate">
                            <div class="w-[340px] my-8 px-2 py-2 border border-primary rounded backdrop-blur-md backdrop-brightness-50">
                                <p class="text-sm">Sale starting soon</p>
                                <div class="mt-2 grid grid-cols-4 gap-2 auction-countdown">
                                    <div
                                        v-for="i in saleStartsIn" :key="i[0]"
                                        class=" h-full w-full bg-white bg-opacity-10 rounded text-center py-2">
                                        <p class="text-xl">{{ i?.[1] ?? '??' }}</p>
                                        <p class="text-xs capitalize">{{ i[0] }}</p>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else-if="!isLive">
                            <div class="text-[55%] sm:text-sm md:text-md">
                                <svg viewBox="0 0 600 150" height="9.375em" xmlns="http://www.w3.org/2000/svg">
                                    <mask id="myMask">
                                        <text x="0" y="64" font-size="4rem" stroke-width="2.5px" font-weight="900" font-family="Work Sans" stroke="#ffffff" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                            LAUNCH DATE
                                        </text>
                                        <text x="0" y="140" font-size="4rem" stroke-width="2.5px" font-weight="900" font-family="Work Sans" stroke="#ffffff" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                            DROPPING SOON
                                        </text>
                                    </mask>
                                    <text x="0" y="64" mask="url(#myMask)" stroke-width="2.5px" font-size="4rem" font-weight="900" font-family="Work Sans" stroke-opacity="0.8" stroke="#ffffff" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                        LAUNCH DATE
                                    </text>
                                    <text x="0" y="140" mask="url(#myMask)" stroke-width="2.5px" font-size="4rem" font-weight="900" font-family="Work Sans" stroke-opacity="0.8" stroke="#ffffff" fill="#000000" paint-order="stroke" letter-spacing="2px">
                                        DROPPING SOON
                                    </text>
                                </svg>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <template v-if="isLive">
                <div class="mb-8">
                    <template v-if="themeStatus === 'LOADED'">
                        <div class="container m-auto mt-8">
                            <template v-if="status == 'LOADED'">
                                <template v-if="wave1Boxes.length">
                                    <h4
                                        class="font-medium bg-no-repeat bg-center flex justify-center mt-10 mb-6"
                                        :style="{ backgroundImage: `-webkit-image-set(url(${ThemeSeparatorImg}) 2x)` }">
                                        <span class="flex-1 text-right mr-8">WAVE #1</span>
                                        <span class="flex-1 font-normal ml-4">2022-11-22</span>
                                    </h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
                                        <router-link
                                            v-for="token_id, i in wave1Boxes" :key="token_id + i"
                                            :to="{ name: 'BoxSale', 'params': { 'theme': token_id.split('/')[0], 'box': token_id.split('/')[1] } }">
                                            <BoxCard :mode="saleStartsInSeconds < 0 ? 'SALE' : 'PRESALE'" :token-name="token_id"/>
                                        </router-link>
                                    </div>
                                </template>
                                <template v-if="wave2Boxes.length">
                                    <h4
                                        class="font-medium bg-no-repeat bg-center flex justify-center mt-10 mb-6"
                                        :style="{ backgroundImage: `-webkit-image-set(url(${ThemeSeparatorImg}) 2x)` }">
                                        <span class="flex-1 text-right mr-8">WAVE #2</span>
                                        <span class="flex-1 font-normal ml-4">2022-11-24</span>
                                    </h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
                                        <router-link
                                            v-for="token_id, i in wave2Boxes" :key="token_id + i"
                                            :to="{ name: 'BoxSale', 'params': { 'theme': token_id.split('/')[0], 'box': token_id.split('/')[1] } }">
                                            <BoxCard :mode="saleStartsInSeconds < 0 ? 'SALE' : 'PRESALE'" :token-name="token_id"/>
                                        </router-link>
                                    </div>
                                </template>
                                <h4
                                    class="font-medium bg-no-repeat bg-center flex justify-center mt-10 mb-6"
                                    :style="{ backgroundImage: `-webkit-image-set(url(${ThemeSeparatorImg}) 2x)` }">
                                    <span class="flex-1 text-right mr-8">WAVE #3</span>
                                    <span class="flex-1 font-normal ml-4">2022-11-26</span>
                                </h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-4"/>
                            </template>
                            <template v-else>
                                <p class="text-center">Loading boxes</p>
                            </template>
                        </div>
                    </template>
                    <template v-else-if="themeStatus === 'FETCHING'">
                        <div class="h-[400px] flex justify-center items-center"><p class="text-xl font-medium text-grad-darker italic">Loading collection <i class="ml-4 fas fa-spinner animate-spin-slow"/></p></div>
                    </template>
                    <template v-else-if="themeStatus === 'ERROR'">
                        <div class="h-[400px] flex justify-center items-center flex-col">
                            <p class="text-xl font-medium my-4">Error loading data</p>
                            <p class="rounded bg-grad-light font-mono text-copy border-grad-darkest border p-4">{{ genesisStore.themedata[themeName]._error }}</p>
                        </div>
                    </template>
                </div>
            </template>
            <div class="bg-black text-white pb-8">
                <div class="container max-w-[42rem] m-auto py-8">
                    <h3 class="text-center mb-6">FAQ</h3>
                    <div class="faq flex flex-col gap-4">
                        <ToggleParagraph>
                            <template #title>What is Starknet Planet?</template>
                            <p>StarkNet Planet is the first official theme created for briq. It’s a composition of many different sets on the theme of venturing into the unknown.</p>
                            <p>It celebrates the diversity of the StarkNet ecosystem and the playfulness of playing with spaceships and rockets as a kid. You will find spacemen, rocket ships, and different modules representing projects from the StarkNet ecosystem.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>What’s a briq box?</template>
                            <p>A briq box is an NFT which holds briqs and instructions on how to build an official briq set. If you follow the instructions in the booklet and mint the set, we will verify it on the blockchain and give you a seal of authenticity.</p>
                            <p>You can choose to keep the briq box like a collectioner or you can choose to open up the box. All our NFT’s are tradable.</p>
                            <p>Unboxing your box is a one-time action that can’t be undone: once a box is opened, it will be burned and you’ll get the briqs and the booklet NFT in your wallet in exchange. Once you have your briqs and the instruction booklet, you can start building your official set.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>How does the instruction booklet work?</template>
                            <p>The instruction booklet details how to build an official set. It’s represented as a little booklet, in the form of an NFT. You can trade the booklet or use it to create an official set. </p>
                            <p>To build an official set you need to build the correct set by following the instructions and hold the corresponding booklet in your wallet. If you build the correct shape without the booklet, you can still mint it your set, but it will not be an official one.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>What happens when I’ve finished building my official set?</template>
                            <p>Once you have built the correct shape in the briq builder, the system will tell you that you can now mint it. Minting an official set will transfer the required briqs and the booklet to the newly minted set. They don’t disappear, they’re just part of the set. You can get them back by disassembling your set.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>What happens if I disassemble an official set?</template>
                            <p>Disassembling an official set will burn it, and you will receive the corresponding booklet NFT and the briqs.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>On which blockchain is briq available?</template>
                            <p>Briq is available on StarkNet, a validity rollup working on Ethereum (more information <a href="https://starkware.co/starknet/" target="_blank">here</a>). </p>
                            <p>In terms of wallet you can use <a href="https://www.argent.xyz/argent-x/" target="_blank">Argent X</a> and <a href="https://braavos.app/" target="_blank">Braavos</a>. Metamask doesn’t yet work on StarkNet. We recommend using the Chrome browser.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>How do I build a set presented in a box?</template>
                            <p>Get the box, unbox it, then select it in your user profile to start building it in the <router-link :to="{ name: 'Builder' }" target="_blank">briq builder</router-link> and follow the instructions.</p>
                            <p>If you need help using the builder, go to the <a href="https://www.notion.so/4a4958337970483dbfc2c1184290b42f" target="_blank">help center</a>.</p>
                        </ToggleParagraph>
                        <ToggleParagraph>
                            <template #title>Something doesn’t work, what should I do?</template>
                            <p><a href="https://discord.gg/kpvbDCw5pr" target="_blank">Reach out to us on Discord</a>, the team will help you out!</p>
                        </ToggleParagraph>
                    </div>
                </div>
            </div>
        </div>
        <Footer/>
    </div>
</template>
