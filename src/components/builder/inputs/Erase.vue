<template>
    <div>
        <Button @click="clear">Clear All</Button>
    </div>
</template>

<script lang="ts">
import Button from "../../generic/Button.vue";

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
        };
    },
    components: { Button },
    methods: {
        async clear() {
            await this.$store.dispatch("builderData/clear");
        }
    }
})
</script>
