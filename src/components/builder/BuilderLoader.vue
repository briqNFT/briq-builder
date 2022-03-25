<template>
    <SplashScreen/>
    <BuilderAsync/>
</template>

<script lang="ts">
import BuilderAsync from '@/components/Builder/BuilderAsync.vue';
import SplashScreen from '@/components/Builder/SplashScreen.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    components: {
        BuilderAsync,
        SplashScreen
    }
});
</script>