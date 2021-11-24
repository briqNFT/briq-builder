<script setup lang="ts">
import SetGridItem from './SetGridItem.vue';
</script>

<template>
    <div :class="asModal ? 'w-full h-full p-24 invisible absolute top-0' : 'w-full min-h-screen h-full bg-briq-light'">
        <div :class="'visible px-4 py-2 ' + (asModal ? 'rounded-md shadow-xl w-full h-full bg-briq-light' : 'container mx-auto')">
            <button v-if="asModal" class="float-right text-4xl text-gray-700" @click="$emit('close')">X</button>
            <h1 class="text-center my-8">Browse sets</h1>
            <div class="my-4">
                <p><input class="w-full" v-model="searchText" type="text" placeholder="Type to search"/></p>
            </div>
            <div class="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <SetGridItem v-for="setId in chainSets" :key="setId" :setId="setId" :searchText="searchText"/>
                <div v-for="i in 10" class="w-full h-40 bg-briq rounded-md p-4" :key="i">
                    <h4 class="text-center">Test Item</h4>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            searchText: "",
        }
    },
    props: ["asModal"],
    emits: ["close"],
    computed: {
        chainSets: function() {
            return this.$store.state.builderData.chainSets
        }
    },
})
</script>