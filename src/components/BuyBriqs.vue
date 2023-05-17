<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BuyBriqsWidget from './BuyBriqsWidget.vue';
import Window from './generic/Window.vue';
import Flyout from './generic/Flyout.vue';
</script>

<style scoped>
.faq h2 {
    @apply mb-1;
}
.faq p {
    @apply leading-snug mb-2;
}
</style>

<template>
    <Header/>
    <div class="container m-auto max-w-[50rem] flex flex-col align-center min-h-screen gap-4">
        <div class="flex justify-center mt-6">
            <Flyout size="w-auto" class="p-8 rounded-md">
                <BuyBriqsWidget class="w-[32rem] max-w-[32rem]"/>
            </Flyout>
        </div>
        <div class="flex flex-col gap-4 faq mt-8">
            <div>
                <h2>How does the briq token work?</h2>
                <p>briqs are building blocks stored on the blockchain with which you can build NFTs!  If you disassemble your NFT built with briq, you get your briqs back and can build something new! Technically, briqs are ERC-1155 compliant tokens.</p>
            </div>
            <div>
                <h2>How many briqs will there be?</h2>
                <p>Similarly to construction blocks, briqs are not limited in supply, but the price will vary following demand.</p>
            </div>
            <div>
                <h2>What’s the pricing for briqs?</h2>
                <p>briqs are priced according to current demand.</p>
                <p>
                    If the demand increases, the price for briqs will increase, and vice-versa.<br>
                    The price increases with each purchase and decreases over time. If we sell TODO briqs per year, the price should remain about constant.<br>
                    There is also a daily surge price, which prevents flooding the market on a single day.
                </p>
                <p>
                    The current price for 100 briqs is TODO. Every 100 briqs increases the price by TODO.<br>
                    There is currently no extra cost from daily 'surge demand'.
                </p>
            </div>
            <div>
                <h2>What does the demand curve for briq look like?</h2>
                <p>ICI GRAPHE</p>
            </div>
        </div>
    </div>
    <Footer/>
</template>
