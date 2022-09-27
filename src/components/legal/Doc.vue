<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
    <Header/>
    <div class="container m-auto">
        <iframe :src="`/legal/${route.params.doc}.html`" class="w-full h-screen m-4"/>
    </div>
    <Footer/>
</template>
