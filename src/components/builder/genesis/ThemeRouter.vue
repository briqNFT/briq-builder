<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ThemeMainPage from './ThemeMainPage.vue';
import ThemePageDucks from './ThemePageDucks.vue';
import ThemePageDucksFrens from './ThemePageDucksFrens.vue';

const route = useRoute();

const components = {
    'ducks_everywhere': ThemePageDucks,
    'ducks_frens': ThemePageDucksFrens,
} as Record<string, unknown>;

const comp = computed(() => components?.[route.params.theme as string] ?? ThemeMainPage);
</script>

<template>
    <KeepAlive>
        <component :is="comp"/>
    </KeepAlive>
</template>
