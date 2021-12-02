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
            <div class="flex justify-around flex-nowrap my-10">
                <div class="centerall flex-1">
                    <h1 class="font-display font-black">briq</h1>
                    <p>NFT matter.<br/>NFTs that matter.<br/>Seize the briqs of construction.</p>
                    <button>Build</button>
                </div>
                <div class="centerall flex-1"><GMIcon/></div>
            </div>
        </div>
        <div class="bg-briq-dark my-20 row">
            <div class="flex justify-between flex-nowrap">
                <div class="centerleft flex-auto"><ComposableIcon/></div>
                <div class="centerright flex-initial">
                    <h2>NFTS should be composable</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex justify-between flex-nowrap">
                <div class="centerleft flex-initial">
                    <h2>NFTS should be interoperable</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
                <div class="centerright flex-auto"><InteroperableIcon/></div>
            </div>
        </div>
        <div class="row bg-briq-dark my-20">
            <div class="flex justify-between flex-nowrap">
                <div class="centerleft flex-auto"><OnChainIcon/></div>
                <div class="centerright flex-initial">
                    <h2>NFTS should be On-Chain</h2>
                    <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                </div>
            </div>
        </div>
        <div class="my-40"></div>
        <div class="row py-8">
            <div class="flex justify-around">
                <div class="flex-1">
                    <h5>Backed By</h5>
                    <div class="flex justify-around">
                        <img class="px-20 py-10" :src="FabricIcon"/>
                        <img class="px-20 py-10" :src="FirstIcon"/>
                    </div>
                </div>
                <div class="bg-white h-auto" style="width:1px;"></div>
                <div class="flex-1">
                    <h5>Partners</h5>
                    <img class="px-20 py-10" :src="StarkwareIcon"/>
                </div>
            </div>
            <div class="flex justify-center gap-10 !my-10">
                <p>Twitter</p>
                <p>Discord</p>
                <p>Github</p>
            </div>
            <div>
                <p>Copyright © 2021 S&L Technologies. All rights reserved. Legal Terms</p>
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
svg {
    @apply drop-shadow-xl;
}

button {
    @apply font-semibold border-white rounded-lg border-4 px-1;
}
</style>