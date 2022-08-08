<script setup lang="ts">
import { RealmsLogo } from '@/conf/realms';
</script>

<template>
    <div class="absolute bottom-0 right-0 p-2 text-white">
        <a target="_blank" href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3">
            <h5
                v-if="CONF.theme === 'realms'"
                class="text-5xl font-bold drop-shadow-lg px-4 py-6 alpha-pill briq-logo flex flex-col items-center leading-[3rem]">
                <!-- style="fill: rgba(var(--color-text));" -->
                <span>briq</span><span class="text-3xl leading-[0.5rem]">x</span><span><RealmsLogo height="4.5rem"/></span>
            </h5>
            <h5 v-else="" class="text-5xl font-bold drop-shadow-lg px-4 py-6 alpha-pill briq-logo">briq</h5>
        </a>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    inject: ['CONF'],
});
</script>

<style scoped>
.alpha-pill {
    position: relative;
}
.alpha-pill::after {
    display: block;
    content: 'alpha';
    font-style: italic;

    @apply bg-primary px-2 py-0.5 text-text-on-primary text-sm leading-5;
    position: absolute;
    bottom: 0;
    right: 0;

    @apply rounded-md shadow-sm;
}
</style>
