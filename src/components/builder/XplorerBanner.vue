<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';

const showXplorerBanner = ref(false);
if (window.localStorage.getItem('showXplorerBanner') !== 'false')
    if (Date.now() > 1686229200000) {
        window.localStorage.setItem('showXplorerBanner', 'true');
        showXplorerBanner.value = true;
    }

const hideXplorerbanner = () => {
    showXplorerBanner.value = false;
    window.localStorage.setItem('showXplorerBanner', 'false');
}

onBeforeMount(() => {
    if (window.location.href.includes('xplorer='))
        hideXplorerbanner();
});

</script>

<template>
    <RouterLink @click="hideXplorerbanner()" v-if="showXplorerBanner" to="/builder?xplorer=true">
        <div class="bg-primary font-medium text-text-on-primary select-none flex items-center">
            <p class="hidden sm:block flex-1 text-center text-sm py-2">The Argent Xplorer Quest is ongoing - click here to get your NFT !</p>
            <p class="sm:hidden block flex-1 text-center text-sm py-2">The Argent Xplorer Quest is ongoing<br>Click here to get your NFT !</p>
            <Btn no-style class="text-text-on-primary text-lg py-0 px-8" @click.stop.prevent="hideXplorerbanner()"><i class="far fa-times"/></Btn>
        </div>
    </RouterLink>
</template>