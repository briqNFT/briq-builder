<script setup lang="ts">
import ToggleParagraph from '@/components/generic/ToggleParagraph.vue';
</script>

<style scoped>
.faq p {
    @apply mb-4 text-justify text-sm text-[#aaaaaa] leading-snug;
}
.faq p a {
    @apply text-primary;
}
</style>

<template>
    <div class="bg-black text-white pb-8">
        <div class="container max-w-[42rem] m-auto py-8">
            <h3 class="text-center mb-6">FAQ</h3>
            <div class="faq flex flex-col gap-4">
                <ToggleParagraph>
                    <template #title>What is Ducks Everywhere?</template>
                    <div>
                        <p>The <a href="https://twitter.com/DucksEverywher2" target="_blank">Ducks Everywhere</a> collection is waddling into town, and it's bringing a whole flock of adorable NFT duckies with it.</p>
                        <p>These tiny, briq-built ducks are the perfect addition to any collection that's in need of some quackers. With only 200 available, each one is a unique creation of artist <a href="https://twitter.com/outsmth" target="_blank">OutSmth</a></p>
                    </div>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>How does the sale work?</template>
                    <div>
                        <p>The sale happens in two steps: First an allowlist auction where all whitelisted addresses can bid on a maximum of 5 different ducks.</p>
                        <p>Then, the ducks that haven’t been sold will be sold in a blind raffle open to everyone. You’ll be able to buy one of the remaining ducks, but you won’t know which one until the raffle is over and we reveal the ducks!</p>
                    </div>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>Which addresses are in the auction allowlist?</template>
                    <div>
                        <p> - Addresses which own a Duck on StarkNet Testnet Goerli 1 on the date of the snapshot (will be announced via our <a href="https://twitter.com/briqNFT" target="_blank">Twitter</a>)</p>
                        <p> - Addresses which own a box, a booklet or an official briq set on StarkNet Mainnet.</p>
                        <p>Custom creations do not qualify for the allowlist.</p>
                    </div>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>What do I get when I buy a Ducks Everywhere set?</template>
                    <p>You will get a fully built out briq Official Set. This Official Set will contain a Ducks Everywhere Booklet, that can be used to identify this NFT amongs all other briq sets and ensure it remains unique forever.</p>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>Do I need to build the Ducks Everywhere set?</template>
                    <p>Nope! The set is already fully built out by OutSmth.</p>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>What happens if I disassemble my Ducks Everywhere set?</template>
                    <div>
                        <p>You will receive briqs and the booklet NFT inside the Ducks Everywhere. You will be able to build anything you want with the briqs you receive.</p>
                        <p>If you want to rebuild your Ducks Everywhere set you will be able to do so by following the instructions in the booklet.</p>
                    </div>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>On which blockchain is this available?</template>
                    <div>
                        <p>Briq is available on StarkNet, a validity rollup working on Ethereum (more information <a href="https://starkware.co/starknet/" target="_blank">here</a>). </p>
                        <p>In terms of wallet you can use <a href="https://www.argent.xyz/argent-x/" target="_blank">Argent X</a> and <a href="https://braavos.app/" target="_blank">Braavos</a>. Metamask doesn’t yet work on StarkNet. We recommend using the Chrome browser.</p>
                    </div>
                </ToggleParagraph>
                <ToggleParagraph>
                    <template #title>Something doesn’t work, what should I do?</template>
                    <p><a href="https://discord.gg/kpvbDCw5pr" target="_blank">Reach out to us on Discord</a>, the team will help you out!</p>
                </ToggleParagraph>
            </div>
        </div>
    </div>
</template>