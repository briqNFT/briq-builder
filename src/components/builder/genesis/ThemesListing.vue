<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const availableThemes = [
    {
        name: 'BitConnect',
        img: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧱</text></svg>',
        description: 'Biiiiit Conneeeeeeeeeeect',
    },
    {
        name: 'Starkware',
        img: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧱</text></svg>',
        description: 'Biiiiit Conneeeeeeeeeeect',
    },
]
</script>


<style scoped>
</style>

<template>
    <Header/>
    <div class="container m-auto">
        <h2>Ongoing auctions</h2>
        <div class="grid grid-cols-3 gap-4">
            <div v-for="box in availableThemes" class="h-[20rem] text-center bg-black rounded-lg">
                <h2>{{ box.name }}</h2>
                <p class="max-h-[10rem] flex"><img :src="box.img"></p>
                <p>{{ box.description }}</p>
                <routerLink :to="{ name: 'Theme', 'params': { 'theme': 'test' } }"><Btn>Purchase</Btn></routerLink>
            </div>
        </div>
        <h2>Coming Soon</h2>
        <div class="grid grid-cols-3 gap-4">
            <div v-for="box in availableThemes" class="h-[20rem] text-center bg-black rounded-lg">
                <h2>{{ box.name }}</h2>
                <p class="max-h-[10rem] flex"><img :src="box.img"></p>
                <p>{{ box.description }}</p>
            </div>
        </div>
        <h2>Closed auctions</h2>
        <div class="grid grid-cols-4 gap-4">
            <div v-for="box in availableThemes" class="h-[15rem] text-center bg-black rounded-lg">
                <h2>{{ box.name }}</h2>
                <p class="max-h-[10rem] flex"><img :src="box.img"></p>
                <p>{{ box.description }}</p>
            </div>
        </div>
    </div>
    <Footer/>
</template>
