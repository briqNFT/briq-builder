<template>
    <Window class="!w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <template #title>Rename set</template>
        <p>Set {{ metadata.name }}</p>
        <p class="md:hidden block"><textarea v-model="description" cols="40"/></p>
        <p class="hidden md:block"><textarea v-model="description" cols="80"/></p>
        <button class="btn float-right my-4" @click="save">Save</button>
    </Window>
</template>

<script lang="ts">
import { setsManager } from '../../../builder/SetsManager';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            description: "",
        }
    },
    props: ["metadata"],
    mounted() {
        this.description = this.metadata.desc;
    },
    methods: {
        save: function() {
            this.$emit("close", this.description);
        }
    }
})
</script>