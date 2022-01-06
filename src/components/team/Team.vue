<script setup lang="ts">
import Header from '../landing_page/Header.vue';

import Sylve from "../../assets/sylve.png";
import Lancelot from "../../assets/lancelot.png";
import FabricIcon from '../../assets/fabric.png'
import FirstIcon from '../../assets/first.png'
import StarkwareIcon from '../../assets/starkware.png'
</script>

<template>
    <div class="">
        <Header></Header>
        <h1 class="text-center overflow-auto my-4 py-8 lg:py-12 font-display !text-8xl font-semibold bg-briq-dark">Team</h1>
        <!--<h1 class="text-center my-8 font-display !text-6xl font-medium">the team</h1>-->
        <div class="my-8 lg:my-16 overflow-auto flex flex-around flex-wrap md:flex-nowrap text-center container m-auto">
            <div class="flex-1 flex flex-col items-center">
                <p><img style="border-radius:50%" class="shadow-xl border-deep-blue border-8 max-w-[20rem]" :src="Sylve"/></p>
                <h1 class="py-4 md:py-8">Sylve CHEVET</h1>
                <h2 class="py-2 md:py-4">CEO</h2>
                <h3 class="py-2 md:py-4">HEC / Ledger</h3>
                <h3 class="py-2 md:py-4"><a href="https://twitter.com/sylvechv">@sylvechv</a></h3>
            </div>
            <div class="block md:hidden my-4 w-full bg-white mx-32" style="height:1px"></div>
            <div class="flex-1 flex flex-col items-center">
                <p><img style="border-radius:50%" class="shadow-xl border-deep-blue border-8 max-w-[20rem]"  :src="Lancelot"/></p>
                <h1 class="py-4 md:py-8">Lancelot de&nbsp;FERRIÈRE</h1>
                <h2 class="py-2 md:py-4">CTO</h2>
                <h3 class="py-2 md:py-4">HEC / JobTeaser / 0&nbsp;A.D.</h3>
                <h3 class="py-2 md:py-4"><a href="https://twitter.com/wraitii">@wraitii</a></h3>
            </div>
        </div>
        <div class="flex justify-center gap-10 !my-16 py-16 text-5xl bg-briq-dark">
            <a href="https://twitter.com/briqs_" target="_blank"><p><i class="fab fa-twitter"></i></p></a>
            <a href="https://discord.gg/kpvbDCw5pr" target="_blank"><p><i class="fab fa-discord"></i></p></a>
            <a href="https://github.com/S-L-Technologies/" target="_blank"><p><i class="fab fa-github"></i></p></a>
        </div>
        <div class="py-8">
            <div class="flex justify-around flex-wrap">
                <div class="flex-initial">
                    <h2 class="text-center">BACKED BY</h2>
                    <div class="flex justify-around flex-wrap">
                        <img class="px-20 py-10" :src="FabricIcon"/>
                        <img class="px-20 py-10" :src="FirstIcon"/>
                    </div>
                </div>
                <div class="bg-white h-auto lg:block hidden" style="width:2px;"></div>
                <div class="flex-initial">
                    <h2 class="text-center">PARTNERS</h2>
                    <div class="flex justify-around">
                        <img class="px-20 py-10" :src="StarkwareIcon"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="my-16">
            <p class="text-center font-light">Copyright © 2021 S&L Technologies. All rights reserved. <router-link class="font-medium px-4" to="/legal">Legal terms</router-link></p>
        </div>
    </div>
</template>

<style scoped>
h1 {
    @apply text-6xl font-semibold;
}
h2 {
    @apply text-5xl font-semibold;
}
h3, h4 {
    @apply text-4xl font-semibold italic;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
        }
    },
})
</script>
