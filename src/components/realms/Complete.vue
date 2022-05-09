<script setup lang="ts">
import Header from '../landing_page/Header.vue';

import Banner from '@/assets/realms/compet-banner.jpeg';
</script>

<template>
    <Header/>
    <div class="container m-auto alternate-buttons">
        <h2 class="text-center font-display">The building phase of the briq/Realms competition is over!</h2>
        <h3 class="text-center font-display my-8">Voting is now on if you own Realms.</h3>
        <div class="flex justify-around text-lg font-semibold flex-wrap gap-8">
            <a class="btn" href="https://twitter.com/LootRealms">Follow the voting on the Realms Twitter</a>
            <a class="btn" href="https://testnet.playoasis.xyz/collection/0x0266b1276d23ffb53d99da3f01be7e29fa024dd33cd7f7b1eb7a46c67891c9d0?selectedCategory=%5B%7B%22trait_type%22%3A%22Realms%22%2C%22label%22%3A%22yes%22%2C%22value%22%3A%22yes%22%7D%5D">
                Open the collection on PlayOasis
            </a>
        </div>
        <h4 class="text-center text-2xl font-semibold my-8"><a class="btn" href="https://atlas.bibliothecadao.xyz">Browse the Realms Atlas</a></h4>
        <p class="flex justify-center"><img class="shadow-md my-8" :src="Banner" alt="Competition banner - briq x realms x playOasis"></p>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
})
</script>