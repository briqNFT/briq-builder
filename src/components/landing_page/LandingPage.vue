<script setup lang="ts">
import Header from './Header.vue';

import GMIcon from './GM.svg?component'
import ComposableIcon from './Composable.svg?component'
import InteroperableIcon from './Interoperable.svg?component'
import OnChainIcon from './OnChain.svg?component'

import FabricIcon from '../../assets/fabric.png'
import FirstIcon from '../../assets/first.png'
import StarkwareIcon from '../../assets/starkware.png'

import AlphaBanner from '../AlphaBanner.vue';
</script>

<template>
    <div class="w-full h-full bg-briq text-white text-lg relative text-center font-sans alternate-buttons">
        <Header></Header>
        <div class="row">
            <div class="flex flex-wrap justify-around md:my-6 my-10">
                <div class="centerall flex-1">
                    <p class="md:my-4 my-8 text-2xl">Briq is NFT matter.<br/>Briqs build NFTs that matter.<br/>Seize the briqs of construction.</p>
                    <div class="alpha-pill py-4 px-3">
                        <button @click="$router.push({ name: 'Builder' })"><span class="px-4 py-1 inline-block">Build</span></button>
                    </div>
                </div>
                <div class="centerall flex-1"><GMIcon class="lg:scale-100 scale-75"/></div>
            </div>
        </div>
        <div class="bg-briq-dark my-20 row">
            <div class="flex flex-wrap justify-between">
                <div class="md:centerleft centerall flex-auto"><ComposableIcon/></div>
                <div class="md:centerright centerall flex-initial">
                    <h2>NFTS should be composable</h2>
                    <p>Briqs can be combined to create NFTs called sets.<br/>
                    Sets can be disassembled to get the briqs back and create something new.<br/>
                    Sets can be combined to create even more complex structures.<br/>
                    Briqs are NFT matter.</p>
                </div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex flex-wrap justify-between">
                <div class="centerall md:centerleft flex-initial">
                    <h2>NFTS should be interoperable</h2>
                    <p>Briqs and sets can be used in any game and can be interpreted as you see fit.<br/>
                    Build a car and race. Tear it apart and build a plane.<br/>
                    Your NFTs are not stuck in a data silo, they can always be reused for something new.<br/>
                    Briqs are NFTs that matter.</p>
                </div>
                <div class="centerall md:centerright flex-auto"><InteroperableIcon/></div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex flex-wrap justify-between">
                <div class="centerall md:centerleft flex-auto"><OnChainIcon/></div>
                <div class="centerall md:centerright flex-initial">
                    <h2>NFTS should be On-Chain</h2>
                    <p>Briqs and sets are stored on-chain for everyone to reuse.<br/>
                    Briqs don’t have shape, or color, they are up to interpretation.<br/>
                    Feel free to use briqs in any way you want.<br/>
                    Seize the briqs of construction.</p>
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
                <a href="https://twitter.com/briqs_" target="_blank"><p><i class="fab fa-twitter"></i></p></a>
                <a href="https://discord.gg/kpvbDCw5pr" target="_blank"><p><i class="fab fa-discord"></i></p></a>
                <a href="https://github.com/S-L-Technologies/" target="_blank"><p><i class="fab fa-github"></i></p></a>
            </div>
            <div>
                <p class="font-light">Copyright © 2021 S&L Technologies. All rights reserved. <router-link class="font-medium px-4" to="/legal">Legal terms</router-link></p>
            </div>
        </div>
    </div>
    <AlphaBanner/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
})
</script>

<style scoped>
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
    @apply btn;
}

.alpha-pill {
    position: relative
}
.alpha-pill ::after {
    display: block;
    content: "alpha";
    font-style: italic;

    @apply bg-briq-light px-2 py-0.5 text-deep-blue text-sm;
    position: absolute;
    top: 0;
    right: 0;

    @apply rounded-xl shadow-sm;
}
.comingsoon {
    position: relative;
}
.comingsoon::after {
    display: block;
    content: " Coming Soon ";
    border: 0.25rem solid white;
    font-style: italic;
    width:100%;
    height:100%;
    position: absolute;
    top: 0;
    left: 0;
    @apply rounded-md;
    text-shadow: 2px 1px 3px rgba(0, 0, 0, 0.4);
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0), 20px,
        rgba(247, 137, 74, 0.5) 20px,
        rgba(247, 137, 74, 0.5) 30px
    );
}
</style>