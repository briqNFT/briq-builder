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
    <div class="pseudobody w-full h-full bg-briq text-white relative text-center">
        <div class="header m-auto flex justify-between">
            <div class="">
                <h3>Briq</h3>
            </div>
            <div class="flex gap-4">
                <p>Whitepaper</p>
                <p>Resources</p>
                <button>Connect</button>
            </div>
        </div>
        <div class="row">
            <div class="flex justify-between flex-nowrap my-10">
                <div>
                    <h1>BRIQ</h1>
                    <p>NFT matter.<br/>NFTs that matter.<br/>Seize the briqs of construction.</p>
                    <button>Build</button>
                </div>
                <div><GMIcon/></div>
            </div>
        </div>
        <div class="bg-briq-dark my-10 row">
            <div class="flex justify-between flex-nowrap">
                <div><ComposableIcon/></div>
                <div>
                    <div class="text-right">
                        <h2>NFTS should be composable</h2>
                        <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="row bg-briq-dark my-10">
            <div class="flex justify-between flex-nowrap">
                <div>
                    <div class="text-left">
                        <h2>NFTS should be interoperable</h2>
                        <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                    </div>
                </div>
                <div><InteroperableIcon/></div>
            </div>
        </div>
        <div class="row bg-briq-dark my-10">
            <div class="flex justify-between flex-nowrap">
                <div><OnChainIcon/></div>
                <div>
                    <div class="text-right">
                        <h2>NFTS should be On-Chain</h2>
                        <p>SOEhtosejr ozjetoizjefojzeof oziefjosidjf oisdjf ozijsdfoizjfo izjoifj soidjf osdjf osdjfo  sdofisdoifj </p>
                    </div>
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
    @apply container m-auto lg:w-[80rem];
}
.row > div {
    @apply container m-auto lg:w-[80rem];
}
.row > div > div {
    @apply flex flex-col flex-nowrap justify-center items-center;
}

svg {
    @apply drop-shadow-md;
}
</style>