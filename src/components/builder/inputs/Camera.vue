<template>
    <div class="flex flex-col">
        <Btn @click="resetCamera">Reset to Default</Btn>
    </div>
</template>

<script lang="ts">
import Button from "../../generic/Button.vue";

import { resetCamera } from '../../../builder/graphics/builder.js'

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
        };
    },
    components: { Button },
    methods: {
        resetCamera
    }
})
</script>
