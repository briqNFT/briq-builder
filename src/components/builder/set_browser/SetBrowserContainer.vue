<template>
    <Window v-if="asModal" @close="$emit('close')" class="w-full md:!w-4/5">
        <template #big-title>Set Browser</template>
        <SetBrowser :metadata="metadata"></SetBrowser>
    </Window>
    <div v-else="">
        <h2 class="text-center">Set Browser</h2>
        <SetBrowser :metadata="metadata"></SetBrowser>
    </div>
</template>

<script lang="ts">
import SetBrowser from './SetBrowser.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    emits: ["close"],
    props: ["metadata"],
    computed: {
        asModal() {
            return this?.metadata?.asModal;
        },
    },
    components: { SetBrowser }
})
</script>