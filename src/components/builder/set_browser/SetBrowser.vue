<script setup lang="ts">
import SetGridItem from './SetGridItem.vue';
import MiddleModal from '../../MiddleModal.vue';
</script>

<template>
    <div :class="asModal ? 'w-full h-full md:px-24 py-24 absolute top-0' : 'w-full min-h-screen bg-briq'" :style="asModal ? { 'backgroundColor': 'rgba(0, 0, 0, 0.3)' } : ''"
        @click.self="$emit('close')"
        >
        <div :class="'alternate-buttons visible px-8 py-4 md:container md:mx-auto ' + (asModal ? 'rounded-md shadow-xl h-full bg-briq' : '')">
            <button v-if="asModal" class="float-right text-2xl" @click="$emit('close')">X</button>
            <h2 class="text-center my-8">Browse sets</h2>
            <div class="my-4">
                <p><input class="w-full" v-model="searchText" type="text" placeholder="Search by set ID or set name"/></p>
            </div>
            <div class="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div v-if="chainSets.length === 0">Nothing here yet.</div>
                <SetGridItem v-for="setId in chainSets" :key="setId" :setId="setId" :searchText="searchText"/>
                <!--
                <div v-for="i in 10" class="w-full h-40 bg-briq rounded-md p-4" :key="i">
                    <h4 class="text-center">Test Item</h4>
                </div>
                -->
            </div>
            <MiddleModal/>
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
            return this.$store.state.builderData.chainSets.concat(this.$store.state.builderData.genericChainSets)
        }
    },
})
</script>