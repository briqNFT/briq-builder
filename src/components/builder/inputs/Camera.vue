<template>
    <div class="flex flex-col">
        <Btn @click="putAllInView">Reset Camera</Btn>
    </div>
</template>

<script lang="ts">
import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {};
    },
    methods: {
        putAllInView() {
            dispatchBuilderAction('put_all_in_view');
        },
    },
});
</script>
