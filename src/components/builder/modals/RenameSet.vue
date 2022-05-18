<template>
    <Window class="!w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <template #title>Rename set</template>
        <p>Set {{ metadata.set }}</p>
        <p class="break-words">Current name: {{ set.name }}</p>
        <p class="md:block hidden">
            New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="60">
        </p>
        <p class="md:hidden block">
            New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="30">
        </p>
        <button class="btn float-right my-4" @click="save">Save</button>
    </Window>
</template>

<script lang="ts">
import { setsManager } from '../../../builder/SetsManager';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: '',
        };
    },
    props: ['metadata'],
    mounted() {
        this.name = this.set.name;
    },
    computed: {
        set: function () {
            return setsManager.setsInfo[this.metadata.set].local!;
        },
    },
    methods: {
        save: function () {
            this.$store.dispatch('builderData/change_set_name', { set: this.set, name: this.name });
            this.$emit('close');
        },
    },
});
</script>
