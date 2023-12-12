<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import briqout_logo from '@/assets/briqout/briqout-logo.png?url';
import briqmas_forest_splash from '@/assets/briqmas_forest_splash.jpg?url';

const appList = [
    {
        name: 'briqout',
        route: { name: 'briqout' },
        splash_high: briqout_logo,
        splash_low: briqout_logo,
        style: 'bg-contain',
    },
    {
        name: 'briqmas forest',
        route: { name: 'BriqMas Forest' },
        splash_high: briqmas_forest_splash,
        splash_low: briqmas_forest_splash,
        style: 'bg-cover',
    },

]
</script>


<style scoped>
.popOver > div {
    @apply relative top-0 transition-all duration-300;
}
.popOver:hover > div {
    @apply top-[-0.5rem] shadow-lg;
}
</style>

<template>
    <Header/>
    <div class="container m-auto min-h-screen">
        <h3 class="mt-10 mb-4">Games</h3>
        <div class="mb-4 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <RouterLink class="popOver" v-for="theme of appList" :key="theme.name" :to="theme.route">
                <div class="h-[16rem] flex flex-col justify-center items-center gap-2 rounded-lg relative">
                    <div class="absolute pointer-events-none overflow-hidden rounded-lg h-full w-full">
                        <div
                            :class="`w-full h-full bg-origin-content bg-center bg-no-repeat bg-grad-lightest border rounded-lg ${theme.style}`"
                            :style="{ backgroundImage: `url(${theme.splash_high}), url(${theme.splash_low})` }"/>
                    </div>
                    <h4 class="text-md text-white absolute bottom-3 left-4">{{ theme.name }}</h4>
                </div>
            </RouterLink>
            <!--
            <div class="h-[16rem] flex flex-col justify-center items-center gap-2 bg-grad-lightest border border-grad-light rounded-lg">
                <p class="text-primary">New themes</p>
                <h3>COMING SOON</h3>
                <briqIcon width="1.25rem"/>
            </div>
            -->
        </div>
    </div>
    <Footer/>
</template>
