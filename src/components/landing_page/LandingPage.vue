<script setup lang="ts">
import GMIcon from './GM.svg?component'
import ComposableIcon from './Composable.svg?component'
import InteroperableIcon from './Interoperable.svg?component'
import OnChainIcon from './OnChain.svg?component'

import FabricIcon from './fabric.png'
import FirstIcon from './first.png'
import StarkwareIcon from './starkware.png'

</script>

<template>
    <div class="pseudobody w-full h-full bg-briq text-white text-lg relative text-center font-sans">
        <div class="header m-auto flex justify-between items-center font-semibold">
            <div class="text-xl">
                <h3>briq</h3>
            </div>
            <div class="flex gap-4 items-center">
                <p>Whitepaper</p>
                <p>Resources</p>
                <button>Connect</button>
            </div>
        </div>
        <div class="row">
            <div class="flex flex-wrap justify-around my-10">
                <div class="centerall flex-1">
                    <h1 class="text-8xl font-display font-black">briq</h1>
                    <p class="my-8 text-2xl">NFT matter.<br/>NFTs that matter.<br/>Seize the briqs of construction.</p>
                    <button>Build</button>
                </div>
                <div class="centerall flex-1"><GMIcon class="lg:scale-100 scale-75"/></div>
            </div>
        </div>
        <div class="bg-briq-dark my-20 row">
            <div class="flex flex-wrap justify-between">
                <div class="md:centerleft centerall flex-auto"><ComposableIcon/></div>
                <div class="md:centerright centerall flex-initial">
                    <h2>NFTS should be composable</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex flex-wrap justify-between">
                <div class="centerall md:centerleft flex-initial">
                    <h2>NFTS should be interoperable</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
                <div class="centerall md:centerright flex-auto"><InteroperableIcon/></div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex flex-wrap justify-between">
                <div class="centerall md:centerleft flex-auto"><OnChainIcon/></div>
                <div class="centerall md:centerright flex-initial">
                    <h2>NFTS should be On-Chain</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
            </div>
        </div>
        <div class="my-40"></div>
        <div class="row py-8">
            <div class="flex justify-around flex-wrap">
                <div class="flex-initial">
                    <h2>BACKED BY</h2>
                    <div class="flex justify-around flex-wrap">
                        <img class="px-20 py-10" :src="FabricIcon"/>
                        <img class="px-20 py-10" :src="FirstIcon"/>
                    </div>
                </div>
                <div class="bg-white h-auto lg:block hidden" style="width:2px;"></div>
                <div class="flex-initial">
                    <h2>PARTNERS</h2>
                    <div class="flex justify-around">
                        <img class="px-20 py-10" :src="StarkwareIcon"/>
                    </div>
                </div>
            </div>
            <div class="flex justify-center gap-10 !my-10 text-5xl">
                <p><i class="fab fa-twitter"></i></p>
                <p><i class="fab fa-discord"></i></p>
                <p><i class="fab fa-github"></i></p>
            </div>
            <div>
                <p class="font-light">Copyright © 2021 S&L Technologies. All rights reserved. <router-link class="font-medium px-4" to="/legal">Legal terms</router-link></p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
})
</script>

<style>
.header > div, .row > div {
    @apply px-4 py-4;
}
.header {
    @apply container m-auto lg:w-[70rem];
}
.row {
    @apply py-20;
}
.row > div {
    @apply container m-auto lg:w-[70rem];
}
.centerall {
    @apply flex flex-col flex-nowrap justify-center items-center;
}
.centerright {
    @apply flex flex-col flex-nowrap justify-center items-end text-right;
}
.centerleft {
    @apply flex flex-col flex-nowrap justify-center items-start text-left;
}

h2 {
    @apply font-black my-4;
}

svg {
    @apply drop-shadow-xl;
}

button {
    @apply font-semibold border-white rounded-lg border-4 px-1;
}
</style>