<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ThemeMainPage from './ThemeMainPage.vue';
import ThemePageDucks from './ThemePageDucks.vue';

const route = useRoute();

const components = {
    'ducks_everywhere': ThemePageDucks,
} as Record<string, unknown>;

const comp = computed(() => components?.[route.params.theme as string] ?? ThemeMainPage);
</script>

<template>
    <Component :is="comp"/>
</template>
