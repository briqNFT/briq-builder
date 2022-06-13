<script setup lang="ts">
import Modals from '@/components/Modals.vue';
import Purchasing from './Purchasing.vue';
import { pushModal } from '@/components/Modals.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const availableBoxes = [
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

<template>
    <div class="container m-auto">
        <h1 class="text-center">briq genesis sale</h1>
        <div class="flex flex-col">
            <div v-for="box in availableBoxes" class="h-[20rem] w-full text-center bg-accent border-4 border-darker rounded-lg">
                <h2>{{ box.name }}</h2>
                <p class="max-h-[10rem] flex"><img :src="box.img"></p>
                <p>{{ box.description }}</p>
                <routerLink :to="{ name: 'Theme', 'params': { 'theme': 'test' } }"><Btn>Purchase</Btn></routerLink>
            </div>
        </div>
    </div>
    <Modals/>
</template>

<style scoped>
</style>
