<template>
    <Window @close="$emit('close')" class="w-auto md:w-4/5 lg:w-3/5 xl:w-1/2">
        <div style="min-height: 400px;">
            <template v-if="step=='delegate'">
                <component @close="$emit('close')" :is="delegate"></component>
            </template>
        </div>
    </Window>
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
