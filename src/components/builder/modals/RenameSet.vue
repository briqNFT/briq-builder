<template>
    <div class="md:w-2/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Rename set</h3>
            <p>Set {{ metadata.set }}</p>
            <p>Current name: {{ set.name }}</p>
            <p>New name: <input v-model="name" type="text"/></p>
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