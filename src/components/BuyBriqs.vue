<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BuyBriqsWidget from './BuyBriqsWidget.vue';

</script>

<template>
    <Header/>
    <div class="container m-auto max-w-[50rem] flex flex-col align-center min-h-screen gap-4">
        <h1 class="text-center">Buy briqs</h1>
        <p>Buy briqs directly and get building! briqs are tokens used to build NFTs called sets. Build anything you want with your briqs!</p>
        <div class="flex justify-center">
            <BuyBriqsWidget class="w-[32rem] max-w-[32rem]"/>
        </div>
        <h1>FAQ</h1>
        <div>
            <h2>How does the briq token work?</h2>
            <p>briqs are building blocks stored on the blockchain with which you can build NFTs!  If you disassemble your NFT built with briq, you get your briqs back and can build something new! Technically, briqs are ERC-1155 compliant tokens.</p>
            <h2>How many briqs will there be?</h2>
            <p>Similarly to construction blocks, briqs are not made to be limited.</p>
            <h2>What’s the pricing for briqs?</h2>
            <p>briqs are emitted following a bonding curve, meaning that you can always buy briqs but if the demand increases, the price for briqs will increase. If the demand for briq decreases, the price will also decrease. The current price for a briq is = . More information about the briq curve here.</p>
            <h2>What does the demand curve for briq look like?</h2>
            <p>ICI GRAPHE</p>
        </div>
    </div>
    <Footer/>
</template>
