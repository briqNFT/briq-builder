<script setup lang="ts">
import SplashScreen from '@/components/builder/SplashScreen.vue';
import { shallowRef } from 'vue';

const builderComp = shallowRef(undefined);

import('@/Dispatch').then(x => builderComp.value = x.Builder);
// Import three, we know we'll need it as well.
import('@/three_wrapper');
</script>

<template>
    <SplashScreen/>
    <component v-if="builderComp" :is="builderComp"/>
</template>
