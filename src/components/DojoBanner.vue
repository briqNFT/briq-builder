<script setup lang="ts">
import { ref } from 'vue';

const showDojoBanner = ref(false);

if (window.localStorage.getItem('showDojoBanner') !== 'false') {
    window.localStorage.setItem('showDojoBanner', 'true');
    showDojoBanner.value = true;
}

const hideDojoBanner = () => {
    showDojoBanner.value = false;
    window.localStorage.setItem('showDojoBanner', 'false');
}

</script>

<template>
    <div
        v-if="showDojoBanner"
        class="bg-primary font-medium text-text-on-primary select-none flex items-center">
        <p class="hidden sm:block flex-1 text-center text-sm py-2">We've migrated to Dojo ! Read the announcement <a href="https://twitter.com/briqNFT/status/1729777534433202677" class="underline">here</a> !</p>
        <p class="sm:hidden block flex-1 text-center text-sm py-2">We've migrated to Dojo !<br>Read the announcement <a href="https://twitter.com/briqNFT/status/1729777534433202677" class="underline">here</a> !</p>
        <Btn no-style class="text-text-on-primary text-lg py-0 px-8" @click.stop.prevent="hideDojoBanner()"><i class="far fa-times"/></Btn>
    </div>
</template>