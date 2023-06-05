<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import BuyBriqsWidget from './BuyBriqsWidget.vue';
import Window from './generic/Window.vue';
import Flyout from './generic/Flyout.vue';
</script>

<style scoped>
.faq h2 {
    @apply mb-1 text-lg;
}
.faq p {
    @apply leading-snug mb-2;
}
.faq a {
    @apply text-primary font-medium;
}
</style>

<template>
    <Header/>
    <div class="container m-auto max-w-[50rem] flex flex-col align-center min-h-screen gap-4">
        <div class="flex justify-center mt-2 tall-sm:mt-10">
            <Flyout size="w-auto" class="p-8 rounded-md">
                <BuyBriqsWidget class="w-[32rem] max-w-[32rem]"/>
            </Flyout>
        </div>
        <div class="flex flex-col gap-4 faq mt-8 mb-12">
            <div>
                <h2>What are briqs? What can I do with them?</h2>
                <p>briqs are building blocks stored on the blockchain with which you can build NFTs!<br>If you disassemble your NFT built with briqs, you get your briqs back and you can build something new!<br>On the technical side, briqs are ERC-1155 compliant tokens.</p>
            </div>

            <div>
                <h2>How many briqs will there be?</h2>
                <p>The briq factory is always open: briqs are not limited in supply!<br>Our current target is to manufacture around 100&nbsp;000 new briqs per year.</p>
            </div>

            <div>
                <h2>How much does it cost to buy a briq?</h2>
                <p>The briqs use a dynamic pricing algorithm: the protocol expects to sell a certain amount of briq every year. If the demand is lower than expected, the price will decrease, if the demand is higher, the price will increase.<br>Think of it as a “production capacity” of the briq factory. If you want to learn more about the pricing algorithm, check out the <a href="https://briqnft.notion.site/briq-factory-b1803578bcff4ad0a88fd6086e02b92f">briqipedia</a>.</p>
            </div>
        </div>
    </div>
    <Footer/>
</template>
