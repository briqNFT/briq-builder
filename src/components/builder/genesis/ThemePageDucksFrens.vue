<script setup lang="ts">
import { computed } from 'vue';
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';

import DucksEverywhereCover from '@/components/themes/DucksEverywhereCover.vue';
import ObjectListing from '@/components/themes/ObjectListing.vue';

const themeName = computed(() => 'ducks_frens');

</script>

<template>
    <div class="">
        <Header/>
        <div>
            <DucksEverywhereCover :theme-name="themeName"/>
            <div class="mb-8">
                <ObjectListing :theme-name="themeName"/>
            </div>
        </div>
        <Footer/>
    </div>
</template>
