<template>
    <Window v-if="asModal" class="w-full md:!w-4/5">
        <template #big-title>Set Browser</template>
        <SetBrowser :metadata="metadata"/>
    </Window>
    <div v-else="">
        <h2 class="text-center">Set Browser</h2>
        <SetBrowser :metadata="metadata"/>
    </div>
</template>

<script lang="ts">
import SetBrowser from './SetBrowser.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    props: ['metadata'],
    computed: {
        asModal() {
            return this?.metadata?.asModal;
        },
    },
    components: { SetBrowser },
});
</script>
