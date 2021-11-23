<template>
    <div class="w-1/2">
        <div class="relative">
            <h3 class="text center w-full">Rename set</h3>
            <p>Set {{ metadata.set }}</p>
            <p>Current name: {{ set.name }}</p>
            <p>New name: <input v-model="name" type="text"/></p>
            <button class="btn float-right" @click="save">Save</button>
        </div>
    </div>
</template>

<script lang="ts">
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
            return this.$store.state.builderData.wipSets.filter(x => x.id === this.metadata.set)?.[0];
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