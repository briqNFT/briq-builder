<template>
    <div class="w-full">
        <Btn class="w-full" @click="clear">Clear All</Btn>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {};
    },
    methods: {
        async clear() {
            await this.$store.dispatch('builderData/clear');
        },
    },
});
</script>
