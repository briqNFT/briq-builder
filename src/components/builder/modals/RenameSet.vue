<template>
    <div class="w-auto xl:max-w-[49%] lg:max-w-[80%] max-w-full">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Rename set</h3>
            <p>Set {{ metadata.set }}</p>
            <p class="break-all">Current name: {{ set.name }}</p>
            <p class="md:block hidden">New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="60"/></p>
            <p class="md:hidden block">New name: <input v-model="name" type="text" maxlength="200" minlength="1" size="30"/></p>
            <button class="btn float-right" @click="save">Save</button>
        </div>
    </div>
</template>

<script lang="ts">
import { setsManager } from '../../../builder/SetsManager';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
        }
    },
    props: ["metadata"],
    emits: ["close"],
    mounted() {
        this.name = this.set.name;
    },
    computed: {
        set: function() {
            return setsManager.setsInfo[this.metadata.set].local!;
        }
    },
    methods: {
        save: function() {
            this.$store.dispatch("builderData/change_set_name", { set: this.set, name: this.name });
            this.$emit("close");
        }
    }
})
</script>