<template>
    <SplashScreen/>
    <BuilderAsync/>
</template>

<script lang="ts">
import BuilderAsync from '@/components/builder/BuilderAsync.vue';
import SplashScreen from '@/components/builder/SplashScreen.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    components: {
        BuilderAsync,
        SplashScreen
    }
});
</script>