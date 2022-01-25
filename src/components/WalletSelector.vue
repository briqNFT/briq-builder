<template>
    <div class="w-auto mx-auto md:w-4/5 lg:w-3/5 xl:w-1/2 bg-briq dark:bg-briq-darker alternate-buttons relative" style="min-height: 400px;">
        <p @click="$emit('close')" class="cursor-pointer font-medium absolute right-0 mx-4">X</p>
        <template v-if="step=='delegate'">
            <component @close="$emit('close')" :is="delegate"></component>
        </template>
    </div>
</template>

<style scoped>
</style>

<script lang="ts">
import ArgentXModal from './wallets/ArgentX.vue';

import { defineComponent, markRaw } from 'vue';
export default defineComponent({
    data() {
        return {
            step: 'delegate', // Defaut to delegate for now, only ArgentX supported.
            delegate: markRaw(ArgentXModal),
        }
    },
    emit: ["close"]
})
</script>
